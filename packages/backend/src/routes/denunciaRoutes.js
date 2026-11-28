import { Router } from "express";
import { denunciaController } from "../container.js";
import {
  validarDenuncia,
  validarEstadoDenuncia,
} from "../middlewares/validations/denunciaValidation.js";
import { exigirIdsValidos } from "../middlewares/validations/idValidation.js";
import { verifyToken, exigirRol } from "../middlewares/auth.js";
import { cargarCuenta } from "../container.js";
import ErrorCatalog from "../errors/errorCatalog.js";

const soloAdmin = [verifyToken, cargarCuenta, exigirRol("adm")];

/**
 * Rutas de denuncias: alta desde una colaboración y gestión en /admin/denuncias.
 * @returns {import("express").Router}
 */
export default function denunciaRoutes() {
  const router = Router();
  exigirIdsValidos(router, {
    id: ErrorCatalog.RECURSO_NO_ENCONTRADO,
  });

  // Ruta operativa para denunciar desde una colaboración existente
  router.post("/colaboraciones/:id/denuncia", validarDenuncia, denunciaController.crearDenuncia);

  // Rutas administrativas (gestión y consulta de denuncias)
  router.get("/admin/denuncias", ...soloAdmin, denunciaController.obtenerDenuncias);
  router.get("/admin/denuncias/:id", ...soloAdmin, denunciaController.obtenerDenunciaPorId);
  router.patch(
    "/admin/denuncias/:id/estado",
    ...soloAdmin,
    validarEstadoDenuncia,
    denunciaController.actualizarEstado,
  );

  return router;
}
