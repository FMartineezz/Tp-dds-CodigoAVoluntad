import { Router } from "express";
import colaboracionController from "../controllers/colaboracionController.js";
import validarColaboracion from  "../middlewares/validations/colaboracionValidation.js"

const pathColaboraciones = "/colaboraciones";

export default function colaboracionRoutes() {

    const router = Router();

    router.get(pathColaboraciones, colaboracionController.obtenerColaboraciones);

    router.get(pathColaboraciones + "/:id", colaboracionController.obtenerColaboracionPorId);

    router.post(pathColaboraciones, validarColaboracion, colaboracionController.crearColaboracion);

    return router;
}