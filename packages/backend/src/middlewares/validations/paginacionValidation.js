import { z as zod } from "zod";
import { AppError } from "../../errors/appError.js";
import ErrorCatalog from "../../errors/errorCatalog.js";
import { LIMITE_MAXIMO, LIMITE_POR_DEFECTO } from "../../utils/paginacion.js";

// ?pagina=N&limite=M en la query string (llegan como texto, por eso el coerce)
const paginacionSchema = zod.object({
  pagina: zod.coerce
    .number({ invalid_type_error: "PAGINACION_PAGINA_INVALIDA" })
    .int("PAGINACION_PAGINA_INVALIDA")
    .min(1, "PAGINACION_PAGINA_INVALIDA")
    .default(1),
  limite: zod.coerce
    .number({ invalid_type_error: "PAGINACION_LIMITE_INVALIDO" })
    .int("PAGINACION_LIMITE_INVALIDO")
    .min(1, "PAGINACION_LIMITE_INVALIDO")
    .max(LIMITE_MAXIMO, "PAGINACION_LIMITE_INVALIDO")
    .default(LIMITE_POR_DEFECTO),
});

// Deja { pagina, limite } en req.paginacion (en Express 5 req.query es de solo lectura)
export const validarPaginacion = (req, res, next) => {
  const resultado = paginacionSchema.safeParse({
    pagina: req.query.pagina,
    limite: req.query.limite,
  });

  if (!resultado.success) {
    const codigo = resultado.error.issues[0].message;
    throw new AppError(ErrorCatalog[codigo], 400, LIMITE_MAXIMO);
  }

  req.paginacion = resultado.data;
  next();
};

export default validarPaginacion;
