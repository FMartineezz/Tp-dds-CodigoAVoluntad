import { z as zod } from "zod";
import ErrorCatalog from "../../errors/errorCatalog.js";
import { AppError } from "../../errors/appError.js";

const mensajeSchema = zod.object({
  // zod.any().refine(...) -> "requerido" va adentro del refine porque zod.any() acepta undefined
  personaColaboradoraId: zod.any().refine((valor) => valor !== undefined && valor !== null, {
    message: "MENSAJE_PERSONA_COLABORADORA_REQUERIDO",
  }),
  texto: zod
    .string({
      required_error: "MENSAJE_TEXTO_REQUERIDO",
      invalid_type_error: "MENSAJE_TEXTO_FORMATO",
    })
    .min(1, "MENSAJE_TEXTO_REQUERIDO"),
});

const validarMensaje = (req, res, next) => {
  const resultado = mensajeSchema.safeParse(req.body);

  if (!resultado.success) {
    const codigo = resultado.error.issues[0].message;
    throw new AppError(ErrorCatalog[codigo], 400);
  }

  next();
};

export default validarMensaje;
