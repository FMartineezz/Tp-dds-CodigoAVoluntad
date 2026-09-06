import { Router } from 'express';

import {HabilidadRespository} from '../repositories/habilidadRepository.js';
import {HabilidadService} from '../services/habilidadService.js';
import {HabilidadController} from '../controllers/habilidadController.js';

const habilidadRepository = new HabilidadRespository();
const habilidadService = new HabilidadService(habilidadRepository);
const habilidadController = new HabilidadController(habilidadService);


const pathHabilidades = "/habilidades"

export default function habilidadRoutes() {
    const router = Router() 
    
    router.get(pathHabilidades, habilidadController.obtenerHabilidades);
    router.get(pathHabilidades + "/:id", habilidadController.obtenerHabilidadPorId);
    router.post(pathHabilidades, habilidadController.crearHabilidad);

    return router 
}