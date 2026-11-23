import { z as zod } from "zod";
import ErrorCatalog from "../../errors/errorCatalog.js";
import { AppError } from "../../errors/appError.js";
import { EstadoDenuncia } from "../../models/denuncia.js";

const denunciaSchema = zod.object({
  descripcion: zod
    .string({
      required_error: "DENUNCIA_DESCRIPCION_REQUERIDA",
      invalid_type_error: "DENUNCIA_DESCRIPCION_REQUERIDA",
    })
    .trim()
    .min(1, "DENUNCIA_DESCRIPCION_REQUERIDA"),
});

/**
 * Valida el body de POST /colaboraciones/:id/denuncia (descripción no vacía) y reemplaza
 * req.body por los datos parseados.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 * @throws {import("../../errors/appError.js").AppError} 400 con el error del catálogo que indique zod.
 */
export const validarDenuncia = (req, res, next) => {
  const resultado = denunciaSchema.safeParse(req.body);

  if (!resultado.success) {
    const codigo = resultado.error.issues[0].message;
    throw new AppError(ErrorCatalog[codigo], 400);
  }

  req.body = resultado.data;
  next();
};

const resolucionDenunciaSchema = zod.object({
  estado: zod.preprocess(
    (valor) => (typeof valor === "string" ? valor.toLowerCase() : valor),
    zod.enum(
      [
        EstadoDenuncia.EN_REVISION,
        EstadoDenuncia.RESUELTA,
        EstadoDenuncia.DESCARTADA,
      ],
      {
        errorMap: (issue) => ({
          message:
            issue.code === "invalid_type"
              ? "DENUNCIA_ESTADO_REQUERIDO"
              : "DENUNCIA_ESTADO_INVALIDO",
        }),
      },
    ),
  ),
});

/**
 * Valida el `estado` de PATCH /admin/denuncias/:id/estado (en_revision, resuelta o descartada,
 * sin importar mayúsculas) y lo deja normalizado en req.body.estado.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 * @throws {import("../../errors/appError.js").AppError} 400 con el error del catálogo que indique zod.
 */
export const validarEstadoDenuncia = (req, res, next) => {
  const resultado = resolucionDenunciaSchema.safeParse(req.body);

  if (!resultado.success) {
    const codigo = resultado.error.issues[0].message;
    throw new AppError(ErrorCatalog[codigo], 400);
  }

  req.body.estado = resultado.data.estado;
  next();
};
