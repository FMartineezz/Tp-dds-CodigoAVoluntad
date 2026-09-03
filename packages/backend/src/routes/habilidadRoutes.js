import { Router } from 'express';

import {HabilidadRespository} from '../models/repositories/habilidadRepository.js';
const habilidadRepository = new HabilidadRespository();
import {HabilidadService} from '../services/habilidadService.js';
const habilidadService = new HabilidadService(habilidadRepository);
import {HabilidadController} from '../controllers/habilidadController.js';
const habilidadController = new HabilidadController(habilidadService);


const pathHabilidades = "/habilidades"

export default function habilidadRoutes() {
    const router = Router() 
    
    router.get(pathHabilidades, habilidadController.obtenerHabilidades);
    router.get(pathHabilidades + "/:id", habilidadController.obtenerHabilidadPorId);
    router.post(pathHabilidades, habilidadController.crearHabilidad);

    return router 
}