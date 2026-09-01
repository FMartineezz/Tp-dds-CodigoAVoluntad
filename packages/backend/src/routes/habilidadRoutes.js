import { Router } from 'express';
import habilidadController from '../controllers/habilidadController.js';
const router = Router();

router.get("/habilidades", habilidadController.obtenerHabilidades);
router.get("/habilidades/:id", habilidadController.obtenerHabilidadPorId);
router.post("/habilidades", habilidadController.crearHabilidad);

export default router;