import { Router } from 'express';
import validarColectivo from '../middlewares/validations/colectivoValidation.js';
import ColectivoController from "../controllers/colectivoController.js";

const pathColectivos = "/colectivos"

export default function colectivoRoutes() {
    const router = Router() 
    
    router.get(pathColectivos, ColectivoController.obtenerColectivos);
    router.get(pathColectivos + "/:id", ColectivoController.obtenerColectivoPorId);
    router.post(pathColectivos,validarColectivo, ColectivoController.crearColectivo);

    return router 
}