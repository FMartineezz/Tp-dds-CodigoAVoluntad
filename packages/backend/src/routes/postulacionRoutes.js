import { Router } from "express";
import { postulacionController } from "../container.js";
import {
  validarPostulacion,
  validarResolucionPostulacion,
} from "../middlewares/validations/postulacionValidation.js";

export default function postulacionRoutes() {
  const router = Router();

  router.get("/colaboradoras/:id/postulaciones", postulacionController.listarDePersona);

  router.get("/colectivos/:colectivoId/postulaciones", postulacionController.listarDeColectivo);

  router.post(
    "/proyectos/:proyectoId/perfiles/:perfilId/postulaciones",
    validarPostulacion,
    postulacionController.crearPostulacion,
  );

  router.patch(
    "/postulaciones/:postulacionId",
    validarResolucionPostulacion,
    postulacionController.actualizarPostulacion,
  );

  return router;
}
