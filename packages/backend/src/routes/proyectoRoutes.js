import { Router } from "express";
import proyectoController from "../controllers/proyectoController.js";
import proyectoValidation from "../middlewares/proyectoValidation.js"

const pathProyectos = "/proyectos";

export default function proyectoRoutes() {

    const router = Router();

    router.get(
        pathProyectos,
        proyectoController.obtenerProyectos
    );

    router.get(
        pathProyectos + "/:id",
        proyectoController.obtenerProyectoPorId
    );

    router.post(
        pathProyectos,
        proyectoValidation,
        proyectoController.crearProyecto
    );

    return router;
}