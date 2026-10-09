import { Router } from "express";
import validarHabilidad from "../middlewares/validations/habilidadValidation.js";
import { habilidadController } from "../container.js";

const pathHabilidades = "/habilidades";

export default function habilidadRoutes() {
  const router = Router();

  router.get("/habilidades", habilidadController.obtenerHabilidades);

  router.get("/habilidades/:id", habilidadController.obtenerHabilidadPorId);

  router.post("/habilidades", validarHabilidad, habilidadController.crearHabilidad);

  return router;
}
