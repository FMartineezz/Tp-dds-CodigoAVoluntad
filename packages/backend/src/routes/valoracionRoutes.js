import { Router } from "express";
import { valoracionController } from "../container.js";
import valoracionValidation from "../middlewares/validations/valoracionValidation.js";
import { exigirIdsValidos } from "../middlewares/validations/idValidation.js";
import ErrorCatalog from "../errors/errorCatalog.js";

const router = Router();

exigirIdsValidos(router, {
  colectivoId: ErrorCatalog.COLECTIVO_NO_ENCONTRADO,
  personaColaboradoraId: ErrorCatalog.COLABORADORA_NO_ENCONTRADA,
});

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

/**
 * Rutas de valoraciones: alta y listados de una persona colaboradora o de un colectivo.
 * El router se arma una sola vez, al importar el módulo.
 * @returns {import("express").Router}
 */
export default () => router;