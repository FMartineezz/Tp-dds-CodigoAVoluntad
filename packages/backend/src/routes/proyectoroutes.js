import { Router } from 'express';
import proyectoController from '../controllers/proyectoController.js';

const pathProyecto = "/proyecto"

export default function proyectoRoutes() {
    const router = Router() 
    
    router.get(pathProyectos, proyectoController.obtenerProyectos);
    router.get(pathProyecto + "/id", proyectoController.obtenerProyectoPorId);
    router.post(pathProyectos, proyectoController.crearProyecto);

    return router 
}
