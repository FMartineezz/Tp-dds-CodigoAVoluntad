import { z as zod } from "zod";
import ErrorCatalog from "../../errors/errorCatalog.js";
import { AppError } from "../../errors/appError.js";
import { TipoMedioDeContacto } from "../../models/personaColaboradora.js";

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

const colaboradoraSchema = zod.object({
  // zod.tipoDeDatoQueDeberiaSer({ required_error: CodigoSiEsteCampoNoViaja, invalid_type_error: CodigoSiViajaPeroConOtroTipoDeDato }).min(longitudMinima, CodigoSiNoLlegaAEsaLongitud)
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
  // zod.array(zod.tipoDeDatoDeCadaElemento({ invalid_type_error: CodigoSiAlgunElementoNoCumpleEseTipo }), { required_error: CodigoSiEsteCampoNoViaja, invalid_type_error: CodigoSiNoEsUnArray })
  habilidades: zod.array(zod.string({ invalid_type_error: "COLABORADORA_HABILIDADES_FORMATO" }), {
    required_error: "COLABORADORA_HABILIDADES_REQUERIDAS",
    invalid_type_error: "COLABORADORA_HABILIDADES_FORMATO",
  }),
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
});

const validarColaboradora = (req, res, next) => {
  const resultado = colaboradoraSchema.safeParse(req.body);

  if (!resultado.success) {
    const codigo = resultado.error.issues[0].message;
    throw new AppError(ErrorCatalog[codigo], 400);
  }

  //Pasa al body los medios de contacto ya normalizados (En lowerCase)
  if (resultado.data.contactos) {
    req.body.contactos = resultado.data.contactos;
  }

  next();
};

export default validarColaboradora;
