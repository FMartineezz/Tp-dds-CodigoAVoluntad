import "dotenv/config";
import express from "express";
import cors from "cors";
//import habilidadRoutes from "./src/routes/habilidadRoutes.js";
import routes from "./src/routes/routes.js";
import errorHandler from "./middlewares/errorHandler.js";


const port = process.env.SERVER_PORT || 3000

const app = express();
app.use(express.json());
//app.use(habilidadRoutes);

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
      : true,
  }),
);

routes.forEach(route => app.use(route));
app.use(errorHandler);

app.listen(port , () => {
  console.log("Backend escuchando en puerto " + port);
});
