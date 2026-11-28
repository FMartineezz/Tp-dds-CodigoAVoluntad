import { Router } from "express";
import { validarPaginacion } from "../middlewares/validations/paginacionValidation.js";
import { perfilController } from "../container.js";
import {
  validarPerfil,
  validarActualizacionPerfil,
} from "../middlewares/validations/perfilValidation.js";
import { verifyToken, exigirRol } from "../middlewares/auth.js";
import { exigirIdsValidos } from "../middlewares/validations/idValidation.js";
import ErrorCatalog from "../errors/errorCatalog.js";

/**
 * Rutas de perfiles de un proyecto y de colaboradoras acordes a cada perfil.
 * @returns {import("express").Router}
 */
export default function proyectoRoutes() {
  const router = Router();
  exigirIdsValidos(router, {
    idProyecto: ErrorCatalog.PROYECTO_NO_ENCONTRADO,
    idPerfil: ErrorCatalog.PERFIL_NO_ENCONTRADO,
  });

  router.get("/proyectos/:idProyecto/perfiles", perfilController.obtenerPerfiles);

  router.get("/proyectos/:idProyecto/perfiles/:idPerfil", perfilController.obtenerPerfilPorId);

  router.post("/proyectos/:idProyecto/perfiles", validarPerfil, perfilController.crearPerfil);

  router.patch(
    "/proyectos/:idProyecto/perfiles/:idPerfil",
    validarActualizacionPerfil,
    perfilController.actualizarPerfil,
  );

  router.delete("/proyectos/:idProyecto/perfiles/:idPerfil", perfilController.eliminarPerfil);

  router.get(
    "/proyectos/:idProyecto/perfiles/:idPerfil/colaboradoras-acordes",
    validarPaginacion,
    perfilController.obtenerColaboradorasAcordes,
  );

  return router;
}
