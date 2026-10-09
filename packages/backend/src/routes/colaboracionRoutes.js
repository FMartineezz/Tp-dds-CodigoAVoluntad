import { Router } from "express";
import { colaboracionController } from "../container.js";
import validarColaboracion from "../middlewares/validations/colaboracionValidation.js";

export default function colaboracionRoutes() {
  const router = Router();

  router.get("/colaboraciones", colaboracionController.obtenerColaboraciones);

  router.get("/colaboraciones/:id", colaboracionController.obtenerColaboracionPorId);

  router.post("/colaboraciones", validarColaboracion, colaboracionController.crearColaboracion);

  return router;
}
