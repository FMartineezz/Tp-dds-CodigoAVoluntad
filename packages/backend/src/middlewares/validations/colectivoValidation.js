import { z as zod } from "zod";
import { AppError } from "../../errors/appError.js";
import ErrorCatalog from "../../errors/errorCatalog.js";
import { UBICACION_VALIDA, TipoColectivo } from "../../models/colectivo.js";
import { redesSocialesArraySchema } from "./redSocialValidation.js";

export const colectivoSchema = zod.object({
  nombre: zod
    .string({
      required_error: "COLECTIVO_NOMBRE_REQUERIDO",
      invalid_type_error: "ARGUMENTO_INVALIDO",
    })
    .min(1, "COLECTIVO_NOMBRE_REQUERIDO"),
  descripcion: zod
    .string({
      required_error: "COLECTIVO_DESCRIPCION_REQUERIDA",
      invalid_type_error: "ARGUMENTO_INVALIDO",
    })
    .min(1, "COLECTIVO_DESCRIPCION_REQUERIDA"),
  tipoDeColectivo: zod.nativeEnum(TipoColectivo, {
    errorMap: (issue) => ({
      message:
        issue.code === "invalid_type" ? "COLECTIVO_TIPO_REQUERIDO" : "COLECTIVO_TIPO_INVALIDO",
    }),
  }),
  ubicacion: zod.string().optional(),
  proyectos: zod.array(zod.string()).optional(),
  redesSociales: redesSocialesArraySchema.optional(),
});

const validarColectivo = (req, res, next) => {
  const resultado = colectivoSchema.safeParse(req.body);

  if (!resultado.success) {
    const codigo = resultado.error.issues[0].message;
    throw new AppError(ErrorCatalog[codigo], 400);
  }

  if (resultado.data.redesSociales !== undefined) {
    req.body.redesSociales = resultado.data.redesSociales;
  }

  next();
};

export const validarActualizacionColectivo = (req, res, next) => {
  const schemaActualizacion = colectivoSchema.partial();
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

export { validarColectivo };
export default validarColectivo;
