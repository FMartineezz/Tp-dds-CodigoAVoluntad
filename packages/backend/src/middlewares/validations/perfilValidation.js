import { AppError } from "../../errors/appError.js";
import ErrorCatalog from "../../errors/errorCatalog.js";
import { perfilSchema } from "./proyectoValidation.js";

const validarPerfil = (req, res, next) => {
  const resultado = perfilSchema.safeParse(req.body);

  if (!resultado.success) {
    const codigo = resultado.error.issues[0].message;
    throw new AppError(ErrorCatalog[codigo], 400);
  }

  next();
};

const validarActualizacionPerfil = (req, res, next) => {
  const schemaActualizacion = perfilSchema.partial();
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

export { validarActualizacionPerfil };
export default validarPerfil;
