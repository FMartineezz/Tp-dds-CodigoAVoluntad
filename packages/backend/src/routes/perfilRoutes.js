import { Router } from "express";
import { perfilController } from "../container.js";
import validarPerfil from "../middlewares/validations/perfilValidation.js";

export default function proyectoRoutes() {
  const router = Router();

  router.get("/proyectos/:idProyecto/perfiles", perfilController.obtenerPerfiles);

  router.get("/proyectos/:idProyecto/perfiles/:idPerfil", perfilController.obtenerPerfilPorId);

  router.post("/proyectos/:idProyecto/perfiles", validarPerfil, perfilController.crearPerfil);

  router.patch("/proyectos/:idProyecto/perfiles/:idPerfil", perfilController.actualizarPerfil);

  router.delete("/proyectos/:idProyecto/perfiles/:idPerfil", perfilController.eliminarPerfil);

  router.get(
    "/proyectos/:idProyecto/perfiles/:idPerfil/colaboradoras-acordes",
    perfilController.verColaboradorasAcordes,
  );

  return router;
}
