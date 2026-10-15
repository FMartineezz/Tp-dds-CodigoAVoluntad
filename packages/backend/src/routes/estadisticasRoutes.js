import { Router } from "express";
import { estadisticasController } from "../container.js";

export default function estadisticasRoutes() {
  const router = Router();

  router.get("/estadisticas", estadisticasController.verEstadisticas);

  return router;
}
