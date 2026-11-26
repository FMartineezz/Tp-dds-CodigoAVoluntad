import { AppError } from "../errors/appError.js";
import ErrorCatalog from "../errors/errorCatalog.js";

/**
 * Middleware final de errores: un AppError se responde con su statusCode y `{ code, message }`;
 * cualquier otro error se loguea y se responde 500 con ERROR_INTERNO.
 * @param {Error} error
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
// eslint-disable-next-line no-unused-vars -- Express solo reconoce un middleware de errores si declara exactamente 4 parámetros
const errorHandler = (error, req, res, next) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      code: error.code,
      message: error.message,
    });
  }

  console.error(error);

  const errorInterno = ErrorCatalog.ERROR_INTERNO;

  return res.status(500).json({
    code: errorInterno.code,
    message: errorInterno.message,
  });
};

export default errorHandler;
