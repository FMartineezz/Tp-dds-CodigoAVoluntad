import { AppError } from "../../errors/appError.js";
import ErrorCatalog from "../../errors/errorCatalog.js";

import { z } from "zod";

export const logroSchema = z.object({
  descripcion: z
    .string({
      required_error: "LOGRO_DESCRIPCION_INVALIDA",
      invalid_type_error: "LOGRO_DESCRIPCION_INVALIDA",
    })
    .trim()
    .min(1, "LOGRO_DESCRIPCION_INVALIDA"),

  porcentaje: z
    .number({
      required_error: "LOGRO_PORCENTAJE_INVALIDO",
      invalid_type_error: "LOGRO_PORCENTAJE_INVALIDO",
    })
    .gt(0, "LOGRO_PORCENTAJE_INVALIDO")
    .max(100, "LOGRO_PORCENTAJE_INVALIDO"),

  urlCodigoFuente: z
    .string({
      required_error: "LOGRO_URL_INVALIDA",
      invalid_type_error: "LOGRO_URL_INVALIDA",
    })
    .url("LOGRO_URL_INVALIDA"),
});

// PATCH: todos los campos son opcionales, pero los que vengan se validan igual
const logroParcialSchema = logroSchema.partial();

/**
 * Arma un middleware que valida req.body con `schema` y lo reemplaza por los datos parseados.
 * Si falla, lanza AppError 400 con el error del catálogo que indique zod.
 * @param {import("zod").ZodTypeAny} schema
 * @returns {import("express").RequestHandler}
 */
const validarCon = (schema) => (req, res, next) => {
  const resultado = schema.safeParse(req.body);

  if (!resultado.success) {
    const codigo = resultado.error.issues[0].message;
    throw new AppError(ErrorCatalog[codigo], 400);
  }

  req.body = resultado.data;
  next();
};

/** Valida el body de POST /proyectos/:proyectoId/logros (todos los campos obligatorios). */
export const validarLogro = validarCon(logroSchema);
/** Valida el body de PATCH /proyectos/:proyectoId/logros/:logroId (campos opcionales). */
export const validarActualizacionLogro = validarCon(logroParcialSchema);
