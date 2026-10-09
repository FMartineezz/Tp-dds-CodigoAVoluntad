import { Router } from "express";
import { personaColaboradoraController } from "../container.js";
import { mensajeController } from "../container.js";
import validarPersonaColaboradora from "../middlewares/validations/personaColaboradoraValidation.js";

export default function personaColaboradoraRoutes() {
  const router = Router();

  router.get("/colaboradoras", personaColaboradoraController.obtenerPersonasColaboradoras);

  router.get("/colaboradoras/:id", personaColaboradoraController.obtenerPersonaColaboradoraPorId);

  router.get(
    "/colaboradoras/:personaColaboradoraId/mensajes",
    mensajeController.verBandejaDeEntradaColaboradora,
  );

  router.post(
    "/colaboradoras",
    validarPersonaColaboradora,
    personaColaboradoraController.crearPersonaColaboradora,
  );

  router.get(
    "/colaboradoras/:id/proyectos-acordes",
    personaColaboradoraController.verProyectosAcordes,
  );

  return router;
}
