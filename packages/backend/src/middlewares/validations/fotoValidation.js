import express from "express";
import { AppError } from "../../errors/appError.js";
import ErrorCatalog from "../../errors/errorCatalog.js";

export const TIPOS_DE_FOTO = ["image/jpeg", "image/png", "image/webp"];
// El front la achica a 256×256 antes de mandarla (pesa unos 20 KB): esto es solo un tope.
const PESO_MAXIMO = "300kb";

// Lee el cuerpo del pedido como bytes (solo si el Content-Type es una imagen permitida).
const leerImagen = express.raw({ type: TIPOS_DE_FOTO, limit: PESO_MAXIMO });

/**
 * Recibe la foto en el cuerpo del pedido (los bytes de la imagen, no JSON) y la deja en
 * req.body como Buffer. Responde 400 si no es una imagen permitida o viene vacía, y 413 si
 * pesa de más.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
export function recibirFoto(req, res, next) {
  leerImagen(req, res, (error) => {
    if (error?.type === "entity.too.large") {
      return next(new AppError(ErrorCatalog.FOTO_MUY_GRANDE, 413, PESO_MAXIMO));
    }
    if (error) return next(error);

    // Si el Content-Type no era una imagen permitida, express.raw no lee nada
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      return next(new AppError(ErrorCatalog.FOTO_TIPO_INVALIDO, 400));
    }
    next();
  });
}
