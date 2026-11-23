import { z as zod } from "zod";
import ErrorCatalog from "../../errors/errorCatalog.js";
import { AppError } from "../../errors/appError.js";
import { Emisor } from "../../models/mensaje.js";

const mensajeSchema = zod.object({
  // zod.any().refine(...) -> "requerido" va adentro del refine porque zod.any() acepta undefined
  colectivoId: zod.any().refine((valor) => valor !== undefined && valor !== null, {
    message: "MENSAJE_COLECTIVO_REQUERIDO",
  }),
  personaColaboradoraId: zod.any().refine((valor) => valor !== undefined && valor !== null, {
    message: "MENSAJE_PERSONA_COLABORADORA_REQUERIDO",
  }),
  proyectoId: zod.any().refine((valor) => valor !== undefined && valor !== null, {
    message: "MENSAJE_PROYECTO_REQUERIDO",
  }),
  emisor: zod.preprocess(
    (valor) => (typeof valor === "string" ? valor.toLowerCase() : valor),
    zod.enum([Emisor.COLECTIVO, Emisor.PERSONA], {
      errorMap: (issue) => ({
        message:
          issue.code === "invalid_type" ? "MENSAJE_EMISOR_REQUERIDO" : "MENSAJE_EMISOR_INVALIDO",
      }),
    }),
  ),
  texto: zod
    .string({
      required_error: "MENSAJE_TEXTO_REQUERIDO",
      invalid_type_error: "MENSAJE_TEXTO_FORMATO",
    })
    .min(1, "MENSAJE_TEXTO_REQUERIDO"),
});

const lecturaSchema = zod.object({
  colectivoId: zod.any().refine((valor) => valor !== undefined && valor !== null, {
    message: "MENSAJE_COLECTIVO_REQUERIDO",
  }),
  personaColaboradoraId: zod.any().refine((valor) => valor !== undefined && valor !== null, {
    message: "MENSAJE_PERSONA_COLABORADORA_REQUERIDO",
  }),
  proyectoId: zod.any().refine((valor) => valor !== undefined && valor !== null, {
    message: "MENSAJE_PROYECTO_REQUERIDO",
  }),
  lector: zod.nativeEnum(Emisor, {
    errorMap: (issue) => ({
      message:
        issue.code === "invalid_type" ? "MENSAJE_LECTOR_REQUERIDO" : "MENSAJE_LECTOR_INVALIDO",
    }),
  }),
  leido: zod.boolean(),
});

/**
 * Valida el body de POST /mensajes: ids de colectivo, persona y proyecto, emisor y texto.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 * @throws {import("../../errors/appError.js").AppError} 400 con el error del catálogo que indique zod.
 */
export const validarMensaje = (req, res, next) => {
  const resultado = mensajeSchema.safeParse(req.body);

  if (!resultado.success) {
    const codigo = resultado.error.issues[0].message;
    throw new AppError(ErrorCatalog[codigo], 400);
  }

  next();
};

/**
 * Valida el body de PATCH /mensajes: ids de colectivo, persona y proyecto, lector y `leido`.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 * @throws {import("../../errors/appError.js").AppError} 400 con el error del catálogo que indique zod.
 */
export const validarLecturaDeMensajes = (req, res, next) => {
  const resultado = lecturaSchema.safeParse(req.body);
  if (!resultado.success) {
    const codigo = resultado.error.issues[0].message;
    throw new AppError(ErrorCatalog[codigo], 400);
  }
  next();
};
