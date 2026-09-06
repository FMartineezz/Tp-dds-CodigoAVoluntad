import "dotenv/config";
import express from "express";
import cors from "cors";
import routes from "./src/routes/routes.js";

const port = process.env.SERVER_PORT || 3000

const app = express();
app.use(express.json());


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
