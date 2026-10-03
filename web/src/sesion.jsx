import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, configurarPerdidaDeSesion, tokenGuardado } from './api.js';

const ContextoDeSesion = createContext(null);
const EVENTOS_DE_ACTIVIDAD = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
const AVISO_KEEPALIVE_MS = 4 * 60_000;

// La renovación al abrir la página se hace una sola vez (React en modo estricto monta
// los efectos dos veces en desarrollo y el token viejo deja de servir tras renovarlo).
let renovacionInicial = null;
function renovarUnaSolaVez() {
  renovacionInicial ??= api('POST', '/auth/renovar');
  return renovacionInicial;
}

export function ProveedorDeSesion({ children }) {
  const navegar = useNavigate();
  // useNavigate cambia de identidad al cambiar de página; se guarda en una referencia
  // para que los efectos de la sesión no se vuelvan a ejecutar en cada navegación.
  const navegarRef = useRef(navegar);
  useEffect(() => {
    navegarRef.current = navegar;
  }, [navegar]);
  const [usuario, setUsuario] = useState(null);
  const [inactividadMinutos, setInactividadMinutos] = useState(30);
  const [cargando, setCargando] = useState(true);
  const [aviso, setAviso] = useState(null);
  const ultimaActividad = useRef(Date.now());
  const ultimoContacto = useRef(Date.now());

  const olvidarSesion = useCallback((mensaje) => {
    tokenGuardado.borrar();
    setUsuario(null);
    setAviso(mensaje ?? null);
    navegarRef.current('/login');
  }, []);

  const aplicarSesion = useCallback((respuesta) => {
    tokenGuardado.guardar(respuesta.token);
    setUsuario(respuesta.usuario);
    setInactividadMinutos(respuesta.sesion?.inactividadMinutos ?? 30);
    ultimaActividad.current = Date.now();
    ultimoContacto.current = Date.now();
    setAviso(null);
  }, []);

  // Al abrir la página: si hay un token guardado, se renueva la sesión (token nuevo).
  useEffect(() => {
    configurarPerdidaDeSesion((mensaje) => olvidarSesion(mensaje ?? 'Tu sesión terminó. Iniciá sesión nuevamente.'));
    if (!tokenGuardado.leer()) {
      setCargando(false);
      return;
    }
    renovarUnaSolaVez()
      .then(aplicarSesion)
      .catch(() => tokenGuardado.borrar())
      .finally(() => setCargando(false));
  }, [aplicarSesion, olvidarSesion]);

  // Cierre por inactividad del lado del cliente (el servidor aplica la misma regla).
  useEffect(() => {
    if (!usuario) return undefined;
    const marcarActividad = () => {
      ultimaActividad.current = Date.now();
    };
    EVENTOS_DE_ACTIVIDAD.forEach((evento) => window.addEventListener(evento, marcarActividad, { passive: true }));
    const intervalo = setInterval(() => {
      const ahora = Date.now();
      if (ahora - ultimaActividad.current > inactividadMinutos * 60_000) {
        api('POST', '/auth/logout').catch(() => {});
        olvidarSesion('La sesión se cerró por inactividad. Iniciá sesión nuevamente.');
      } else if (ahora - ultimaActividad.current < 60_000 && ahora - ultimoContacto.current > AVISO_KEEPALIVE_MS) {
        // Si el usuario está usando la página, se avisa al servidor para que no venza la sesión.
        ultimoContacto.current = ahora;
        api('GET', '/auth/yo').catch(() => {});
      }
    }, 15_000);
    return () => {
      EVENTOS_DE_ACTIVIDAD.forEach((evento) => window.removeEventListener(evento, marcarActividad));
      clearInterval(intervalo);
    };
  }, [usuario, inactividadMinutos, olvidarSesion]);

  const valor = useMemo(
    () => ({
      usuario,
      cargando,
      aviso,
      inactividadMinutos,
      async iniciarSesion(email, password) {
        const respuesta = await api('POST', '/auth/login', { email, password, plataforma: 'web' });
        aplicarSesion(respuesta);
        return respuesta.usuario;
      },
      async registrarse(datos) {
        const respuesta = await api('POST', '/auth/registro', { ...datos, plataforma: 'web' });
        aplicarSesion(respuesta);
        return respuesta.usuario;
      },
      async cerrarSesion() {
        await api('POST', '/auth/logout').catch(() => {});
        tokenGuardado.borrar();
        setUsuario(null);
        setAviso('Cerraste la sesión.');
        navegarRef.current('/login');
      },
      async refrescarPerfil() {
        const respuesta = await api('GET', '/auth/yo');
        setUsuario(respuesta.usuario);
      },
      limpiarAviso: () => setAviso(null),
    }),
    [usuario, cargando, aviso, inactividadMinutos, aplicarSesion],
  );

  return <ContextoDeSesion.Provider value={valor}>{children}</ContextoDeSesion.Provider>;
}

export function useSesion() {
  return useContext(ContextoDeSesion);
}

export function inicioSegunRol(usuario) {
  if (usuario?.rol === 'FIA') return '/fia/escuderias';
  if (usuario?.rol === 'ESCUDERIA') return '/escuderia/nomina';
  return '/pilotos';
}
