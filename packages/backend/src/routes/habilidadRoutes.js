import { Router } from 'express';
import validarHabilidad from '../middlewares/validations/habilidadValidation.js';
import { habilidadController } from '../container.js';

const pathHabilidades = "/habilidades";

export default function habilidadRoutes() {
    const router = Router();

    router.get(pathHabilidades, habilidadController.obtenerHabilidades);
    router.get(pathHabilidades + "/:id", habilidadController.obtenerHabilidadPorId);
    router.post(pathHabilidades, validarHabilidad, habilidadController.crearHabilidad);

    return router ;
}