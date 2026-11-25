import { Router } from "express";
import validarReporte from "../middlewares/validations/reporteValidation.js";
import { limiteDeReportes } from "../middlewares/validations/rateLimit.js";
import { reporteController } from "../container.js";
import { exigirIdsValidos } from "../middlewares/validations/idValidation.js";
import ErrorCatalog from "../errors/errorCatalog.js";

/**
 * Rutas de reportes de problemas: por ahora solo el alta, pública (sin cuenta).
 * @returns {import("express").Router}
 */
export default function reporteRoutes() {
  const router = Router();
  exigirIdsValidos(router, { id: ErrorCatalog.REPORTE_NO_ENCONTRADO });

  // Público: con límite por IP para que no se pueda llenar la base de reportes
  router.post("/reportes", limiteDeReportes, validarReporte, reporteController.crearReporte);

  // Equipo administrativo (sin protección hasta que exista el login, como /admin/denuncias)
  router.get("/admin/reportes", reporteController.obtenerReportes);
  router.get("/admin/reportes/:id", reporteController.obtenerReportePorId);
  router.patch("/admin/reportes/:id/estado", reporteController.actualizarEstado);

  return router;
}
