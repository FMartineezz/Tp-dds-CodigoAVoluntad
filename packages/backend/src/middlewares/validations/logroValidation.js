import { AppError } from "../../errors/appError.js";
import ErrorCatalog from "../../errors/errorCatalog.js";

import { z } from "zod";

export const logroSchema = z.object({
  descripcion: z
    .string()
    .trim()
    .min(1, "LOGRO_DESCRIPCION_INVALIDA"),

  porcentaje: z
    .number({
      invalid_type_error: "LOGRO_PORCENTAJE_INVALIDO",
    })
    .gt(0, "LOGRO_PORCENTAJE_INVALIDO")
    .max(100, "LOGRO_PORCENTAJE_INVALIDO"),

  urlCodigoFuente: z
    .string()
    .url("LOGRO_URL_INVALIDA"),
});

const validarLogro = (req, res, next) => {
  const resultado = logroSchema.safeParse(req.body);

  if (!resultado.success) {
    const codigo = resultado.error.issues[0].message;
    throw new AppError(ErrorCatalog[codigo], 400);
  }

  req.body = resultado.data;
  next();
};

export default validarLogro;