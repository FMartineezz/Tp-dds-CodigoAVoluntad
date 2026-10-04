import { z as zod } from "zod";
import ErrorCatalog from "../../errors/errorCatalog.js";
import { AppError } from "../../errors/appError.js";

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
});

const validarColaboradora = (req, res, next) => {
  const resultado = colaboradoraSchema.safeParse(req.body);

  if (!resultado.success) {
    const codigo = resultado.error.issues[0].message;
    throw new AppError(ErrorCatalog[codigo], 400);
  }

  next();
};

export default validarColaboradora;
