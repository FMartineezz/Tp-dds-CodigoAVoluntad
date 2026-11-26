import Lodash from "lodash";

// Ayudas para armar los filtros de mongo de los listados con ?busqueda, ?habilidad, etc.

/**
 * Condición "el campo contiene este texto", sin importar mayúsculas. El texto se escapa para
 * que caracteres como "." o "(" se busquen tal cual y no como parte de una regex.
 * @param {string} texto
 * @returns {{ $regex: string, $options: string }}
 */
export function contieneTexto(texto) {
  return { $regex: Lodash.escapeRegExp(texto), $options: "i" };
}

// Se juntan con $and (y no mezclando claves en un mismo objeto) porque dos filtros pueden
// usar $or a la vez, por ejemplo la búsqueda por texto y el estado del proyecto
/**
 * Junta varias condiciones de mongo en un filtro que exige todas. Sin condiciones, trae todo.
 * @param {Record<string, any>[]} condiciones
 * @returns {Record<string, any>}
 */
export function todasLasCondiciones(condiciones) {
  return condiciones.length ? { $and: condiciones } : {};
}
