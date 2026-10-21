import { z as zod } from "zod";
import { TipoEvaluador } from "../../models/valoracion.js";

export const valoracionSchema = zod.object({
  colaboracionId: zod.any().refine((valor) => valor !== undefined && valor !== null, {
    message: "VALORACION_COLABORACION_ID_INVALIDO",
}),
  evaluador: zod.enum(
    [TipoEvaluador.PERSONA, TipoEvaluador.COLECTIVO],
    { errorMap: () => ({ message: "VALORACION_EVALUADOR_TIPO_FORMATO" }) }
  ),
  puntaje: zod
    .number({ invalid_type_error: "VALORACION_PUNTAJE_FORMATO" })
    .int("VALORACION_PUNTAJE_FORMATO")
    .min(1, "VALORACION_PUNTAJE_RANGO")
    .max(5, "VALORACION_PUNTAJE_RANGO"),

  comentario: zod
    .string({ invalid_type_error: "VALORACION_COMENTARIO_FORMATO" })
    .trim()
    .min(1, "VALORACION_COMENTARIO_REQUERIDO")
    .max(500, "VALORACION_COMENTARIO_LARGO"),
});

export const validarValoracion = (req, res, next) => {
  const resultado = valoracionSchema.safeParse(req.body);

  if (!resultado.success) {
    const codigo = resultado.error.issues[0].message;
    throw new AppError(ErrorCatalog[codigo], 400);
  }

  req.body = resultado.data;
  next();
};
