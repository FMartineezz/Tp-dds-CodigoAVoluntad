import { z as zod } from "zod";
import { TipoRedSocial, esUrlValida } from "../../models/redSocial.js";

export const redSocialSchema = zod.object({
  tipo: zod.preprocess(
    (valor) => (typeof valor === "string" ? valor.trim().toLowerCase() : valor),
    zod.nativeEnum(TipoRedSocial, {
      errorMap: (issue) => ({
        message:
          issue.code === "invalid_type"
            ? "RED_SOCIAL_TIPO_REQUERIDO"
            : "RED_SOCIAL_TIPO_INVALIDO",
      }),
    }),
  ),
  url: zod
    .string({
      required_error: "RED_SOCIAL_URL_REQUERIDA",
      invalid_type_error: "RED_SOCIAL_URL_INVALIDA",
    })
    .trim()
    .min(1, "RED_SOCIAL_URL_REQUERIDA")
    .refine((val) => esUrlValida(val), {
      message: "RED_SOCIAL_URL_INVALIDA",
    }),
});

export const redesSocialesArraySchema = zod
  .array(redSocialSchema, {
    invalid_type_error: "RED_SOCIAL_FORMATO",
  })
  .refine(
    (redes) => {
      const tipos = redes.map((r) =>
        typeof r.tipo === "string" ? r.tipo.trim().toLowerCase() : r.tipo,
      );
      return new Set(tipos).size === tipos.length;
    },
    { message: "RED_SOCIAL_TIPO_DUPLICADO" },
  );
