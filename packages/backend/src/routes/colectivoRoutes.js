import { Router } from 'express';
import ColectivoRepository from "../repositories/colectivoRepository.js";
import ColectivoService from "../services/colectivoService.js";
import ColectivoController from "../controllers/colectivoController.js";

const colectivoRepository = new ColectivoRepository();
const colectivoService = new ColectivoService(colectivoRepository);
const colectivoController = new ColectivoController(colectivoService);

const pathColectivos = "/colectivos"

export default function colectivoRoutes() {
    const router = Router() 
    
    router.get(pathColectivos, (req, res) => {colectivoController.obtenerColectivos(req, res)});
    router.get(pathColectivos + "/:id", (req, res) => {colectivoController.obtenerColectivoPorId(req, res)});
    router.post(pathColectivos, (req, res) => {colectivoController.crearColectivo(req, res)});

    return router 
}