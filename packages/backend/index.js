import "dotenv/config";
import express from "express";
import cors from "cors";
import habilidadRoutes from "./src/routes/habilidadRoutes.js";

const app = express();
app.use(express.json());
app.use(habilidadRoutes);
//app.use(
  //cors({
    //origin: process.env.ALLOWED_ORIGINS
      //? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
      //: true,
  //}),
//);

app.listen(3000, () => {
  console.log("Backend escuchando en puerto 3000");
});
