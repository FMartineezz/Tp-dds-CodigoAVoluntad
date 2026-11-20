// Trae una página de documentos que cumplen el filtro y el total, en paralelo.
// El orden por defecto es del más nuevo al más viejo; se desempata por _id para que
// las páginas sean estables (un mismo documento no aparece en dos páginas).
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
