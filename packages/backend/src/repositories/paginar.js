/**
 * Opciones de {@link paginar}.
 * @typedef {object} OpcionesPaginar
 * @property {Record<string, 1 | -1>} [orden] Orden de la consulta (por defecto `{ _id: -1 }`).
 * @property {string | import("mongoose").PopulateOptions} [populate] Qué referencias poblar.
 */

// Trae una página de documentos que cumplen el filtro y el total, en paralelo.
// El orden por defecto es del más nuevo al más viejo; se desempata por _id para que
// las páginas sean estables (un mismo documento no aparece en dos páginas).
/**
 * Pagina una consulta sobre un modelo de mongoose (con `.lean()`). Los resultados son `any`
 * porque sirve para cualquier modelo: cada repositorio declara el tipo concreto que devuelve.
 * @param {import("mongoose").Model<any>} model
 * @param {Record<string, any>} filtro Filtro de mongo.
 * @param {import("../types.js").Paginacion} paginacion
 * @param {OpcionesPaginar} [opciones]
 * @returns {Promise<import("../types.js").Pagina<any>>}
 */
export async function paginar(
  model,
  filtro,
  { pagina, limite },
  { orden = { _id: -1 }, populate } = {},
) {
  let consulta = model
    .find(filtro)
    .sort(orden)
    .skip((pagina - 1) * limite)
    .limit(limite);
  if (populate) consulta = consulta.populate(populate);

  const [resultados, total] = await Promise.all([consulta.lean(), model.countDocuments(filtro)]);
  return { resultados, total };
}
