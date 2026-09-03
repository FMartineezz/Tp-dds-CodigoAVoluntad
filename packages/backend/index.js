import "dotenv/config";
import express from "express";
import cors from "cors";
//import habilidadRoutes from "./src/routes/habilidadRoutes.js";
import routes from "./src/routes/routes.js";
import ColectivoRepository from "./src/models/repositories/colectivoRepository.js";
import colectivoService from "./src/controllers/colectivoService.js";
import colectivoController from "./src/controllers/colectivoController.js";

const port = process.env.SERVER_PORT || 3000

const app = express();
app.use(express.json());
//app.use(habilidadRoutes);

const colectivoRepository = new ColectivoRepository()
const colectivoService = new ColectivoService(colectivoRepository)
colectivoController(colectivoService)

routes.forEach(route => app.use(route))

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
      : true,
  }),
);

app.listen(port , () => {
  console.log("Backend escuchando en puerto " + port);
});
