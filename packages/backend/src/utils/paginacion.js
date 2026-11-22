/** Cantidad por página si no viene ?limite. */
export const LIMITE_POR_DEFECTO = 20;
/** Máximo aceptado para ?limite. */
export const LIMITE_MAXIMO = 100;

// Cuerpo de respuesta de todos los listados paginados
/**
 * Arma la respuesta de un listado paginado a partir de la página del repositorio.
 * @template T
 * @param {import("../types.js").Pagina<T>} pagina
 * @param {import("../types.js").Paginacion} paginacion
 * @returns {import("../types.js").RespuestaPaginada<T>}
 */
export function respuestaPaginada({ resultados, total }, { pagina, limite }) {
  return {
    resultados,
    pagina,
    limite,
    total,
    totalPaginas: Math.ceil(total / limite),
  };
}
