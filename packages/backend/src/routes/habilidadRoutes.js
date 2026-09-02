import { Router } from 'express';
import habilidadController from '../controllers/habilidadController.js';

const pathHabilidades = "/habilidades"

export default function habilidadRoutes() {
    const router = Router() 
    
    router.get(pathHabilidades, habilidadController.obtenerHabilidades);
    router.get(pathHabilidades + "/id", habilidadController.obtenerHabilidadPorId);
    router.post(pathHabilidades, habilidadController.crearHabilidad);

    return router 
}