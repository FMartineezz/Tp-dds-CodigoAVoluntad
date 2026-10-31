import { Router } from "express";
import * as container from "../container.js";

export default function colaboracionRoutes({ colaboracionController } = container) {
  const router = Router();

  router.get("/colaboraciones", colaboracionController.obtenerColaboraciones);

  router.get("/colaboraciones/:id", colaboracionController.obtenerColaboracionPorId);

  router.delete("/colaboraciones/:id", colaboracionController.desactivarColaboracion);

  return router;
}
