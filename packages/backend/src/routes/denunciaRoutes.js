import { Router } from "express";
import { denunciaController } from "../container.js";
import {
  validarDenuncia,
  validarEstadoDenuncia,
} from "../middlewares/validations/denunciaValidation.js";
import { exigirIdsValidos } from "../middlewares/validations/idValidation.js";
import ErrorCatalog from "../errors/errorCatalog.js";

export default function denunciaRoutes() {
  const router = Router();
  exigirIdsValidos(router, {
    id: ErrorCatalog.RECURSO_NO_ENCONTRADO,
  });

  // Ruta operativa para denunciar desde una colaboración existente
  router.post(
    "/colaboraciones/:id/denuncia",
    validarDenuncia,
    denunciaController.crearDenuncia,
  );

  // Rutas administrativas (gestión y consulta de denuncias)
  router.get("/admin/denuncias", denunciaController.obtenerDenuncias);
  router.get("/admin/denuncias/:id", denunciaController.obtenerDenunciaPorId);
  router.patch(
    "/admin/denuncias/:id/estado",
    validarEstadoDenuncia,
    denunciaController.actualizarEstado,
  );

  return router;
}
