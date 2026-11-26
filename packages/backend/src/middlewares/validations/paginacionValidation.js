import { z as zod } from "zod";
import { AppError } from "../../errors/appError.js";
import ErrorCatalog from "../../errors/errorCatalog.js";
import { LIMITE_MAXIMO, LIMITE_POR_DEFECTO } from "../../utils/paginacion.js";

// ?pagina=N&limite=M en la query string hace que lleguen esos params como texto, por eso el coerce para castearlos a numero
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

// Deja { pagina, limite } en req.paginacion 
/**
 * Valida ?pagina y ?limite (enteros, limite hasta LIMITE_MAXIMO; con valores por defecto).
 * @param {import("../../types.js").RequestPaginado} req Sale con `req.paginacion` cargado.
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 * @throws {import("../../errors/appError.js").AppError} 400 PAGINACION_PAGINA_INVALIDA o PAGINACION_LIMITE_INVALIDO.
 */
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
