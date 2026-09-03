import { Router } from 'express';
import colectivoController from '../controllers/colectivoController.js';

const pathColectivos = "/colectivos"

export default function colectivoRoutes() {
    const router = Router() 
    
    router.get(pathColectivos, (req, res) => {colectivoController.obtenerColectivos(req, res)});
    router.get(pathColectivos + "/id", (req, res) => {colectivoController.obtenerColectivoPorId(req, res)});
    router.post(pathColectivos, (req, res) => {colectivoController.crearColectivo(req, res)});

    return router 
}