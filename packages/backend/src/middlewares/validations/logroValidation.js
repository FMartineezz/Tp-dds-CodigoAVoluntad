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

const validarCon = (schema) => (req, res, next) => {
  const resultado = schema.safeParse(req.body);

  if (!resultado.success) {
    const codigo = resultado.error.issues[0].message;
    throw new AppError(ErrorCatalog[codigo], 400);
  }

  req.body = resultado.data;
  next();
};

export const validarLogro = validarCon(logroSchema);
export const validarActualizacionLogro = validarCon(logroParcialSchema);
