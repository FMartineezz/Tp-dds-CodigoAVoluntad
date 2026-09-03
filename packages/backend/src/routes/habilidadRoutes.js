import { Router } from 'express';
import habilidadController from '../controllers/habilidadController.js';

const pathHabilidades = "/habilidades"

export default function habilidadRoutes() {
    const router = Router() 
    
    router.get(pathHabilidades, (req, res) => {habilidadController.obtenerHabilidades(req, res)});
    router.get(pathHabilidades + "/id", (req, res) => {habilidadController.obtenerHabilidadPorId(req, res)});
    router.post(pathHabilidades, (req, res) => {habilidadController.crearHabilidad(req, res)});

    return router 
}