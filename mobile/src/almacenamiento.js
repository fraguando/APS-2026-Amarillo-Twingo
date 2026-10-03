// En el celular el token se guarda cifrado (expo-secure-store).
// En la versión web de la app (para probarla en el navegador) se usa localStorage.
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const esWeb = Platform.OS === 'web';

export async function leer(clave) {
  try {
    return esWeb ? window.localStorage.getItem(clave) : await SecureStore.getItemAsync(clave);
  } catch {
    return null;
  }
}

export async function guardar(clave, valor) {
  try {
    if (esWeb) window.localStorage.setItem(clave, valor);
    else await SecureStore.setItemAsync(clave, valor);
  } catch {
    /* sin almacenamiento: la sesión dura lo que dure la app abierta */
  }
}

export async function borrar(clave) {
  try {
    if (esWeb) window.localStorage.removeItem(clave);
    else await SecureStore.deleteItemAsync(clave);
  } catch {
    /* nada que borrar */
  }
}
