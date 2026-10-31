import { AppError } from "../errors/appError.js";
import ErrorCatalog from "../errors/errorCatalog.js";
import { RedSocial, TipoRedSocial, esUrlValida } from "../models/redSocial.js";

export function validarYNormalizarRedesSociales(redesSociales) {
  if (redesSociales === undefined) {
    return undefined;
  }

  if (!Array.isArray(redesSociales)) {
    throw new AppError(ErrorCatalog.RED_SOCIAL_FORMATO, 400);
  }

  const tiposVistos = new Set();
  const resultado = [];

  for (const item of redesSociales) {
    if (!item || typeof item !== "object") {
      throw new AppError(ErrorCatalog.ARGUMENTO_INVALIDO, 400);
    }

    if (!item.tipo || typeof item.tipo !== "string" || item.tipo.trim() === "") {
      throw new AppError(ErrorCatalog.RED_SOCIAL_TIPO_REQUERIDO, 400);
    }

    const tipoNormalizado = item.tipo.trim().toLowerCase();
    const tiposValidos = Object.values(TipoRedSocial);
    if (!tiposValidos.includes(tipoNormalizado)) {
      throw new AppError(ErrorCatalog.RED_SOCIAL_TIPO_INVALIDO, 400, item.tipo);
    }

    if (!item.url || typeof item.url !== "string" || item.url.trim() === "") {
      throw new AppError(ErrorCatalog.RED_SOCIAL_URL_REQUERIDA, 400);
    }

    if (!esUrlValida(item.url)) {
      throw new AppError(ErrorCatalog.RED_SOCIAL_URL_INVALIDA, 400, item.url);
    }

    if (tiposVistos.has(tipoNormalizado)) {
      throw new AppError(ErrorCatalog.RED_SOCIAL_TIPO_DUPLICADO, 400, tipoNormalizado);
    }

    tiposVistos.add(tipoNormalizado);
    resultado.push(new RedSocial(tipoNormalizado, item.url.trim()));
  }

  return resultado;
}

export { esUrlValida };
