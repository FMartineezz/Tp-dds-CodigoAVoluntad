import { Router } from "express";
import validarHabilidad from "../middlewares/validations/habilidadValidation.js";
import { habilidadController } from "../container.js";
import { exigirIdsValidos } from "../middlewares/validations/idValidation.js";
import ErrorCatalog from "../errors/errorCatalog.js";

const pathHabilidades = "/habilidades";

export default function habilidadRoutes() {
  const router = Router();
  exigirIdsValidos(router, { id: ErrorCatalog.HABILIDAD_NO_ENCONTRADA_POR_ID });

  router.get("/habilidades", habilidadController.obtenerHabilidades);

  router.get("/habilidades/:id", habilidadController.obtenerHabilidadPorId);

  router.post("/habilidades", validarHabilidad, habilidadController.crearHabilidad);

  return router;
}
