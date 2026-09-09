import { Router } from 'express';
import validarColectivo from '../middlewares/validations/colectivoValidation.js';
import ColectivoController from "../controllers/colectivoController.js";

const pathColectivos = "/colectivos"

export default function colectivoRoutes() {
    const router = Router() 
    
    router.get(pathColectivos, (req, res) => {ColectivoController.obtenerColectivos(req, res)});
    router.get(pathColectivos + "/:id", (req, res) => {ColectivoController.obtenerColectivoPorId(req, res)});
    router.post(pathColectivos,validarColectivo , (req, res) => {ColectivoController.crearColectivo(req, res)});

    return router 
}