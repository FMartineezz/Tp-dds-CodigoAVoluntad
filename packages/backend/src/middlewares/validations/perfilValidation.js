import { AppError } from "../../errors/appError.js";
import ErrorCatalog from "../../errors/errorCatalog.js";
import { perfilSchema } from "./proyectoValidation.js";

/**
 * Valida el body de POST /proyectos/:idProyecto/perfiles con perfilSchema.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 * @throws {import("../../errors/appError.js").AppError} 400 con el error del catálogo que indique zod.
 */
const validarPerfil = (req, res, next) => {
  const resultado = perfilSchema.safeParse(req.body);

  if (!resultado.success) {
    const codigo = resultado.error.issues[0].message;
    throw new AppError(ErrorCatalog[codigo], 400);
  }

  next();
};

/**
 * Valida el body de PATCH /proyectos/:idProyecto/perfiles/:idPerfil (campos opcionales, pero al
 * menos uno) y reemplaza req.body por los datos parseados.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 * @throws {import("../../errors/appError.js").AppError} 400 con el error del catálogo que indique zod.
 */
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

export { validarPerfil, validarActualizacionPerfil };