import { Router } from "express";
import { valoracionController } from "../container.js";
import valoracionValidation from "../middlewares/validations/valoracionValidation.js";

const router = Router();

router.get(
  "/personaColaboradora/:personaColaboradoraId/valoraciones",
  valoracionController.obtenerValoraciones
);

router.get(
  "/colectivo/:colectivoId/valoraciones",
  valoracionController.obtenerValoraciones
);

router.post(
  "/valoraciones",
  valoracionValidation,
  valoracionController.crearValoracion
);

export default () => router;