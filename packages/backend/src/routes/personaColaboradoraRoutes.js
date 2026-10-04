import { Router } from "express";
import { personaColaboradoraController } from "../container.js";
import validarPersonaColaboradora from "../middlewares/validations/colaboradoraValidation.js";

const pathColaboradoras = "/colaboradoras";

export default function personaColaboradoraRoutes() {
  const router = Router();

  router.get(pathColaboradoras, personaColaboradoraController.obtenerPersonasColaboradoras);

  router.get(
    pathColaboradoras + "/:id",
    personaColaboradoraController.obtenerPersonaColaboradoraPorId,
  );

  router.post(
    pathColaboradoras,
    validarPersonaColaboradora,
    personaColaboradoraController.crearPersonaColaboradora,
  );

  return router;
}
