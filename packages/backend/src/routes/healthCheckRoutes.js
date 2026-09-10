import { Router } from "express";
import healthCheckController from "../controllers/healthCheckController.js";


const pathHealthCheck = "/healthCheck";

export default function healthCheckRoutes(){
    const router = Router();

    router.get(pathHealthCheck, healthCheckController.check);

    return router;
}