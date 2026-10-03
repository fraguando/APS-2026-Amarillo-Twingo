// Fuente de la hora actual. Los tests usan un reloj controlable para simular
// el paso del tiempo (inactividad de la sesión, fin del bloqueo, etc.).
export const relojDelSistema = {
  ahora: () => new Date(),
};

export function sumarMinutos(fecha, minutos) {
  return new Date(fecha.getTime() + minutos * 60_000);
}
