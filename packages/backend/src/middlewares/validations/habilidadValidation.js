import { z as zod } from "zod";
import ErrorCatalog from "../../errors/errorCatalog.js";

const habilidadSchema = zod.object({
  // zod.tipoDeDatoQueDeberiaSer({ required_error: CodigoSiEsteCampoNoViaja, invalid_type_error: CodigoSiViajaPeroConOtroTipoDeDato }).min(longitudMinima, CodigoSiNoLlegaAEsaLongitud)
  titulo: zod
    .string({
      required_error: "HABILIDAD_TITULO_REQUERIDO",
      invalid_type_error: "ARGUMENTO_INVALIDO",
    })
    .min(1, "HABILIDAD_TITULO_REQUERIDO"),
  descripcion: zod
    .string({
      required_error: "HABILIDAD_DESCRIPCION_REQUERIDA",
      invalid_type_error: "ARGUMENTO_INVALIDO",
    })
    .min(1, "HABILIDAD_DESCRIPCION_REQUERIDA"),
});

const validarHabilidad = (req, res, next) => {
  const resultado = habilidadSchema.safeParse(req.body);

  // safeParse nunca tira excepción: devuelve { success: true, data } o { success: false, error }, y error.issues es el array (ordenado según el schema) de fallas encontradas
  if (!resultado.success) {
    const codigo = resultado.error.issues[0].message;
    throw new AppError(ErrorCatalog[codigo], 400);
  }

  next();
};

export default validarHabilidad;
