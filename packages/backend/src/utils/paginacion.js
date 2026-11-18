export const LIMITE_POR_DEFECTO = 20;
export const LIMITE_MAXIMO = 100;

// Cuerpo de respuesta de todos los listados paginados
export function respuestaPaginada({ resultados, total }, { pagina, limite }) {
  return {
    resultados,
    pagina,
    limite,
    total,
    totalPaginas: Math.ceil(total / limite),
  };
}
