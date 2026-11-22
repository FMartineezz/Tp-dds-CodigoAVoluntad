import { AppError } from "../../errors/appError.js";
import ErrorCatalog from "../../errors/errorCatalog.js";

// Un id de MongoDB (ObjectId) son 24 caracteres hexadecimales.
const OBJECT_ID = /^[0-9a-f]{24}$/i;

// Valida los ids de la URL antes de llegar al controller. Un id con formato inválido
// (ej. /colectivos/1) no puede existir en la base: se responde 404 con el error del catálogo
// del recurso, en lugar del 500 que daba el CastError de mongoose.
//
// USO (en cada archivo de rutas): exigirIdsValidos(router, { id: ErrorCatalog.COLECTIVO_NO_ENCONTRADO })
// Las claves son los nombres de los parámetros (:id, :colectivoId…) de ESE router.
/**
 * @param {import("express").Router} router
 * @param {Record<string, import("../../errors/errorCatalog.js").EntradaErrorCatalog>} erroresPorParametro
 *   Nombre del parámetro de ruta → error del catálogo a devolver (con 404) si el id no es un ObjectId.
 * @returns {void}
 */
export function exigirIdsValidos(router, erroresPorParametro) {
  for (const [parametro, error] of Object.entries(erroresPorParametro)) {
    router.param(parametro, (req, res, next, valor) => {
      if (OBJECT_ID.test(valor)) return next();
      next(new AppError(error ?? ErrorCatalog.RECURSO_NO_ENCONTRADO, 404, valor));
    });
  }
}
