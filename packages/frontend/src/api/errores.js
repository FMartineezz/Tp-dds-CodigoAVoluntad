/**
 * Ayudas para leer los errores que devuelve Axios.
 *
 * USO:
 *   if (esError(error, 404)) …                → el backend respondió con ese código HTTP
 *   <Alert kind="error">{mensajeDeError(error)}</Alert>
 * El backend siempre responde los errores como { code, message } (catálogo de errores).
 * Si el backend está apagado o no hay internet, error.response no existe.
 */

// true si el backend respondió con ese código HTTP (404, 409…).
export function esError(error, status) {
  return error?.response?.status === status;
}

// Texto para mostrar: el mensaje del backend si lo hay, o uno genérico.
export function mensajeDeError(error, generico = 'Algo salió mal. Probá de nuevo en un rato.') {
  if (!error) return '';
  if (!error.response) return 'No pudimos conectarnos con el servidor. Revisá tu conexión.';
  return error.response.data?.message || generico;
}
