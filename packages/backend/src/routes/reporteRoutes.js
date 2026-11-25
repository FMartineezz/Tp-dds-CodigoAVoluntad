import { Router } from "express";
import validarReporte from "../middlewares/validations/reporteValidation.js";
import { limiteDeReportes } from "../middlewares/validations/rateLimit.js";
import { reporteController } from "../container.js";

/**
 * Rutas de reportes de problemas: por ahora solo el alta, pública (sin cuenta).
 * @returns {import("express").Router}
 */
export default function reporteRoutes() {
  const router = Router();

  // Público: con límite por IP para que no se pueda llenar la base de reportes
  router.post("/reportes", limiteDeReportes, validarReporte, reporteController.crearReporte);

  return router;
}
