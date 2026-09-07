import { Router } from 'express';
import validarHabilidad from '../middlewares/validations/habilidadValidation.js';
import HabilidadController from '../controllers/habilidadController.js';

const pathHabilidades = "/habilidades";

export default function habilidadRoutes() {
    const router = Router();
    
    router.get(pathHabilidades, HabilidadController.obtenerHabilidades);
    router.get(pathHabilidades + "/:id", HabilidadController.obtenerHabilidadPorId);
    router.post(pathHabilidades, validarHabilidad, HabilidadController.crearHabilidad);

    return router ;
}