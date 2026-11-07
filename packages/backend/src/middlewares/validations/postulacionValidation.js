import { z as zod } from "zod";
import ErrorCatalog from "../../errors/errorCatalog.js";
import { AppError } from "../../errors/appError.js";
import { EstadoPostulacion } from "../../models/postulacion.js";

const postulacionSchema = zod.object({
  // zod.any().refine(...) -> "requerido" va adentro del refine porque zod.any() acepta undefined
  personaColaboradoraId: zod.any().refine((valor) => valor !== undefined && valor !== null, {
    message: "POSTULACION_PERSONA_REQUERIDA",
  }),
  anonima: zod.boolean({ invalid_type_error: "POSTULACION_ANONIMA_FORMATO" }).optional(),
});

export const validarPostulacion = (req, res, next) => {
  const resultado = postulacionSchema.safeParse(req.body);

  if (!resultado.success) {
    const codigo = resultado.error.issues[0].message;
    throw new AppError(ErrorCatalog[codigo], 400);
  }

  next();
};

const resolucionPostulacionSchema = zod.object({
  estado: zod.preprocess(
    (valor) => (typeof valor === "string" ? valor.toLowerCase() : valor),
    zod.enum([EstadoPostulacion.ACEPTADA, EstadoPostulacion.RECHAZADA], {
      errorMap: (issue) => ({
        message:
          issue.code === "invalid_type"
            ? "POSTULACION_ESTADO_REQUERIDO"
            : "POSTULACION_ESTADO_INVALIDO",
      }),
    }),
  ),
});

export const validarResolucionPostulacion = (req, res, next) => {
  const resultado = resolucionPostulacionSchema.safeParse(req.body);

  if (!resultado.success) {
    const codigo = resultado.error.issues[0].message;
    throw new AppError(ErrorCatalog[codigo], 400);
  }

  req.body.estado = resultado.data.estado;

  next();
};
