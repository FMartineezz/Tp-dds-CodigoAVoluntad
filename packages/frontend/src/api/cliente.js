/**
 * CLIENTE HTTP: la única configuración de cómo el front le habla al backend.
 *
 * USO: import { api } from './cliente.js';  →  api.get('/colectivos/123')
 * La dirección del backend sale de VITE_API_URL (.env.local); acá no se escribe ninguna URL.
 * SI LO CAMBIÁS: todo lo que deba viajar en TODOS los pedidos (por ejemplo, el token de
 * Keycloak) se agrega acá una sola vez, con un interceptor, y lo heredan todas las pantallas.
 */
import axios from "axios";
import keycloak from "./keycloack.js";

export const api = axios.create({
  // Se pega adelante de cada ruta: api.get('/colectivos') → http://localhost:8000/colectivos
  baseURL: import.meta.env.VITE_API_URL,
  // Si el backend no contesta en 10 segundos se corta el pedido y cae en el caso de error.
  timeout: 10000,
});

api.interceptors.request.use(
  async (config) => {
    if (keycloak.authenticated) {
      // Refresca el token si le quedan menos de 30 segundos de vida
      await keycloak.updateToken(30);
      config.headers.Authorization = `Bearer ${keycloak.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);
// Saca de los parámetros los que no se completaron ('' , null, undefined o false), así un
// filtro vacío no viaja como ?estado= y la URL queda limpia.
// Ej: sinVacios({ pagina: 1, estado: '', busqueda: 'huerta' }) → { pagina: 1, busqueda: 'huerta' }
export function sinVacios(parametros) {
  return Object.fromEntries(
    Object.entries(parametros).filter(
      ([, valor]) => valor !== "" && valor != null && valor !== false,
    ),
  );
}
