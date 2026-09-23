import { Router } from "express";
import perfilController from "../controllers/perfilController.js";

export default function proyectoRoutes() {
  const router = Router();

  router.get("/proyectos/:idProyecto/perfiles", perfilController.obtenerPerfiles);

  router.get("/proyectos/:idProyecto/perfiles/:idPerfil", perfilController.obtenerPerfilesPorId);

  router.post("/proyectos/:idProyecto/perfiles", perfilController.crearPerfil);

  router.patch("/proyectos/:idProyecto/perfiles/:idPerfil", perfilController.actualizarPerfil);

  router.delete("/proyectos/:idProyecto/perfiles/:idPerfil", perfilController.eliminarPerfil);

  return router;
}
