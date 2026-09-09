import { Router } from "express";
import proyectoController from "../controllers/proyectoController.js";
import proyectoValidation from "../middlewares/validations/proyectoValidation.js"

const pathProyectos = "/proyectos";

export default function proyectoRoutes() {

    const router = Router();

    router.get(pathProyectos, proyectoController.obtenerProyectos);

    router.get(pathProyectos + "/:id", proyectoController.obtenerProyectoPorId);

    router.post(pathProyectos, proyectoValidation, proyectoController.crearProyecto);

    router.patch(pathProyectos + "/:id/finalizar", proyectoController.finalizarProyecto);

    // Alternativa recurso-céntrica: PATCH /proyectos/:id con body { finalizado: true }
    router.patch(pathProyectos + "/:id", proyectoController.actualizarProyecto);

    return router;
}