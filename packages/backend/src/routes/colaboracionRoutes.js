import { Router } from "express";
import { colaboracionController } from "../container.js";

export default function colaboracionRoutes() {
  const router = Router();

  router.get("/colaboraciones", colaboracionController.obtenerColaboraciones);

  router.get("/colaboraciones/:id", colaboracionController.obtenerColaboracionPorId);

  return router;
}
