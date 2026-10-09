import { Router } from "express";
import swaggerUiExpress from 'swagger-ui-express';
import { readFile } from "fs/promises"

const swaggerDocument = JSON.parse(
 await readFile(new URL("../../../../docs/api-docs.json", import.meta.url)),
)

export default function swaggerRoutes() {
    const router = Router();
    router.use('/api-docs', swaggerUiExpress.serve, swaggerUiExpress.setup(swaggerDocument));
    return router;
}