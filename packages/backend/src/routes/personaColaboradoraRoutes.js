import { Router } from "express";
import { validarPaginacion } from "../middlewares/validations/paginacionValidation.js";
import { personaColaboradoraController } from "../container.js";
import { mensajeController } from "../container.js";
import validarPersonaColaboradora, {
  validarActualizacionColaboradora,
} from "../middlewares/validations/personaColaboradoraValidation.js";

export default function personaColaboradoraRoutes() {
  const router = Router();

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
