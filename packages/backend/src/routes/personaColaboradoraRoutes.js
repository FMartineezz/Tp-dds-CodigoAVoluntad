import { Router } from "express";
import { validarPaginacion } from "../middlewares/validations/paginacionValidation.js";
import { personaColaboradoraController } from "../container.js";
import { mensajeController } from "../container.js";
import validarPersonaColaboradora, {
  validarActualizacionColaboradora,
} from "../middlewares/validations/personaColaboradoraValidation.js";
import { validarCaptcha } from "../middlewares/validations/captchaValidation.js";
import { exigirIdsValidos } from "../middlewares/validations/idValidation.js";
import ErrorCatalog from "../errors/errorCatalog.js";

/**
 * Rutas de personas colaboradoras (ABM, listado paginado, proyectos acordes y mensajes).
 * @returns {import("express").Router}
 */
export default function personaColaboradoraRoutes() {
  const router = Router();
  exigirIdsValidos(router, {
    id: ErrorCatalog.COLABORADORA_NO_ENCONTRADA,
    personaColaboradoraId: ErrorCatalog.COLABORADORA_NO_ENCONTRADA,
  });

  router.get(
    "/colaboradoras",
    validarPaginacion,
    personaColaboradoraController.obtenerPersonasColaboradoras,
  );

  router.get("/colaboradoras/:id", personaColaboradoraController.obtenerPersonaColaboradoraPorId);

  router.patch(
    "/colaboradoras/:id",
    validarActualizacionColaboradora,
    personaColaboradoraController.actualizarPersonaColaboradora,
  );

  router.get(
    "/colaboradoras/:personaColaboradoraId/mensajes",
    mensajeController.verMensajesColaboradora,
  );

  router.post(
    "/colaboradoras",
    validarCaptcha,
    validarPersonaColaboradora,
    personaColaboradoraController.crearPersonaColaboradora,
  );

  router.get(
    "/colaboradoras/:id/proyectos-acordes",
    validarPaginacion,
    personaColaboradoraController.obtenerProyectosAcordes,
  );

  router.delete("/colaboradoras/:id", personaColaboradoraController.eliminarPersonaColaboradora);

  return router;
}
