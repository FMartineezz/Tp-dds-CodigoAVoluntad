import { z as zod } from "zod";
import ErrorCatalog from "../../errors/errorCatalog.js";
import { AppError } from "../../errors/appError.js";
import { TipoMedioDeContacto } from "../../models/personaColaboradora.js";
import { redesSocialesArraySchema } from "./redSocialValidation.js";

const medioDeContactoSchema = zod
  .object({
    tipo: zod.preprocess(
      (valor) => (typeof valor === "string" ? valor.toLowerCase() : valor),
      zod.nativeEnum(TipoMedioDeContacto, {
        errorMap: (issue) => ({
          message:
            issue.code === "invalid_type"
              ? "MEDIO_CONTACTO_TIPO_REQUERIDO"
              : "MEDIO_CONTACTO_TIPO_INVALIDO",
        }),
      }),
    ),

    valor: zod
      .string({
        required_error: "MEDIO_CONTACTO_VALOR_REQUERIDO",
        invalid_type_error: "MEDIO_CONTACTO_VALOR_FORMATO",
      })
      .min(1, "MEDIO_CONTACTO_VALOR_REQUERIDO"),
  })
  .superRefine((medio, ctx) => {
    if (medio.tipo === TipoMedioDeContacto.EMAIL) {
      if (!zod.string().email().safeParse(medio.valor).success) {
        ctx.addIssue({ code: "custom", message: "MEDIO_CONTACTO_EMAIL_INVALIDO" });
      }
    } else if (!/^\d{10}$/.test(medio.valor)) {
      ctx.addIssue({ code: "custom", message: "MEDIO_CONTACTO_TELEFONO_INVALIDO" });
    }
  });

export const colaboradoraSchema = zod.object({
  nombreFantasia: zod
    .string({
      required_error: "COLABORADORA_NOMBRE_FANTASIA_REQUERIDO",
      invalid_type_error: "ARGUMENTO_INVALIDO",
    })
    .min(1, "COLABORADORA_NOMBRE_FANTASIA_REQUERIDO"),
  git: zod
    .string({
      required_error: "COLABORADORA_GIT_REQUERIDO",
      invalid_type_error: "ARGUMENTO_INVALIDO",
    })
    .min(1, "COLABORADORA_GIT_REQUERIDO"),
  habilidades: zod
    .array(zod.string({ invalid_type_error: "COLABORADORA_HABILIDADES_FORMATO" }), {
      required_error: "COLABORADORA_HABILIDADES_REQUERIDAS",
      invalid_type_error: "COLABORADORA_HABILIDADES_FORMATO",
    })
    .min(1, "COLABORADORA_HABILIDADES_REQUERIDAS"),
  presentacion: zod
    .string({
      required_error: "COLABORADORA_PRESENTACION_REQUERIDA",
      invalid_type_error: "ARGUMENTO_INVALIDO",
    })
    .min(1, "COLABORADORA_PRESENTACION_REQUERIDA"),
  contactos: zod
    .array(medioDeContactoSchema, { invalid_type_error: "MEDIO_CONTACTO_FORMATO" })
    .optional(),
  bloquearMensajeInterno: zod
    .boolean({ invalid_type_error: "COLABORADORA_BLOQUEAR_MENSAJE_INTERNO_INVALIDO" })
    .optional(),
  nombre: zod.string().optional(),
  apellido: zod.string().optional(),
  // Texto ("ella/la") o lista de textos (["ella", "la"]); sin textos vacíos
  pronombres: zod
    .union(
      [
        zod.string().trim().min(1, "COLABORADORA_PRONOMBRES_FORMATO"),
        zod.array(zod.string().trim().min(1, "COLABORADORA_PRONOMBRES_FORMATO")),
      ],
      { errorMap: () => ({ message: "COLABORADORA_PRONOMBRES_FORMATO" }) },
    )
    .optional(),
  redesSociales: redesSocialesArraySchema.optional(),
});

/**
 * Valida el body de POST /colaboradoras y deja en req.body los contactos y redes sociales
 * ya normalizados.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 * @throws {import("../../errors/appError.js").AppError} 400 con el error del catálogo que indique zod.
 */
const validarColaboradora = (req, res, next) => {
  const resultado = colaboradoraSchema.safeParse(req.body);

  if (!resultado.success) {
    const codigo = resultado.error.issues[0].message;
    throw new AppError(ErrorCatalog[codigo], 400);
  }

  // Pasa al body los medios de contacto ya normalizados (En lowerCase)
  if (resultado.data.contactos) {
    req.body.contactos = resultado.data.contactos;
  }
  if (resultado.data.redesSociales !== undefined) {
    req.body.redesSociales = resultado.data.redesSociales;
  }

  next();
};

/**
 * Valida el body de PATCH /colaboradoras/:id (campos opcionales, pero al menos uno) y
 * reemplaza req.body por los datos parseados.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 * @throws {import("../../errors/appError.js").AppError} 400 con el error del catálogo que indique zod.
 */
export const validarActualizacionColaboradora = (req, res, next) => {
  const schemaActualizacion = colaboradoraSchema.partial();
  const resultado = schemaActualizacion.safeParse(req.body);

  if (!resultado.success) {
    const codigo = resultado.error.issues[0].message;
    throw new AppError(ErrorCatalog[codigo], 400);
  }

  if (Object.keys(resultado.data).length === 0) {
    throw new AppError(ErrorCatalog.ARGUMENTO_INVALIDO, 400);
  }

  req.body = resultado.data;
  next();
};

export { validarColaboradora };
export default validarColaboradora;
