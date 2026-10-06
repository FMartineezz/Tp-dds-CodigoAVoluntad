import { Router } from "express";
import { personaColaboradoraController } from "../container.js";
import { mensajeController } from "../container.js";
import validarPersonaColaboradora from "../middlewares/validations/personaColaboradoraValidation.js";

const pathColaboradoras = "/colaboradoras";

export default function personaColaboradoraRoutes() {
  const router = Router();

  router.get(pathColaboradoras, personaColaboradoraController.verPersonasColaboradoras);

  router.get(
    pathColaboradoras + "/:id",
    personaColaboradoraController.verPersonasColaboradoraPorId,
  );

  router.get(
    pathColaboradoras + "/:personaColaboradoraId/mensajes",
    mensajeController.obtenerBandejaDeEntradaColaboradora,
  );

  router.post(
    pathColaboradoras,
    validarPersonaColaboradora,
    personaColaboradoraController.crearPersonaColaboradora,
  );

  return router;
}
