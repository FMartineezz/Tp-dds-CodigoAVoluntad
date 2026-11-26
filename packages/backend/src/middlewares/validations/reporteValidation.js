import { z as zod } from "zod";
import ErrorCatalog from "../../errors/errorCatalog.js";
import { AppError } from "../../errors/appError.js";
import { TipoReporte } from "../../models/reporte.js";

/** Largo máximo de la descripción (alcanza para contar qué pasó, sin pegar un log entero). */
export const LARGO_MAXIMO_DESCRIPCION_REPORTE = 2000;

// Un campo opcional que llega vacío ("") cuenta como que no vino
const vacioComoAusente = (valor) =>
  typeof valor === "string" && valor.trim() === "" ? undefined : valor;

const reporteSchema = zod.object({
  tipo: zod.enum(Object.values(TipoReporte), {
    errorMap: () => ({ message: "REPORTE_TIPO_INVALIDO" }),
  }),
  descripcion: zod
    .string({
      required_error: "REPORTE_DESCRIPCION_REQUERIDA",
      invalid_type_error: "ARGUMENTO_INVALIDO",
    })
    .trim()
    .min(1, "REPORTE_DESCRIPCION_REQUERIDA")
    .max(LARGO_MAXIMO_DESCRIPCION_REPORTE, "REPORTE_DESCRIPCION_MUY_LARGA"),
  pantalla: zod.preprocess(
    vacioComoAusente,
    zod
      .string({ invalid_type_error: "ARGUMENTO_INVALIDO" })
      .trim()
      .max(300, "ARGUMENTO_INVALIDO")
      .optional(),
  ),
  correo: zod.preprocess(
    vacioComoAusente,
    zod
      .string({ invalid_type_error: "REPORTE_CORREO_INVALIDO" })
      .trim()
      .email("REPORTE_CORREO_INVALIDO")
      .optional(),
  ),
});

/**
 * Valida el body de POST /reportes: tipo, descripción y, opcionales, pantalla y correo.
 * Deja en req.body los datos limpios (sin espacios de más y sin campos desconocidos).
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 * @throws {AppError} 400 con el error del catálogo que indique zod.
 */
const validarReporte = (req, res, next) => {
  const resultado = reporteSchema.safeParse(req.body);

  if (!resultado.success) {
    const { message: codigo, path } = resultado.error.issues[0];
    // ARGUMENTO_INVALIDO dice qué campo está mal; el de descripción larga, cuál es el máximo
    const dato = codigo === "ARGUMENTO_INVALIDO" ? path[0] : LARGO_MAXIMO_DESCRIPCION_REPORTE;
    throw new AppError(ErrorCatalog[codigo], 400, dato);
  }

  req.body = resultado.data;
  next();
};

export default validarReporte;
