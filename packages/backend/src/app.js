import express from "express";
import cors from "cors";
import errorHandler from "./middlewares/errorHandler.js";
import ErrorCatalog from "./errors/errorCatalog.js";

// Arma la app de Express con las rutas que recibe. La usan index.js y los tests de integración,
// así los tests prueban exactamente la misma configuración (json, cors, 404 y manejo de errores).
export function buildApp(routes) {
  const app = express();
  app.use(express.json());

  app.use(
    cors({
      origin: process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
        : true,
    }),
  );

  routes.forEach((route) => app.use(route));

  app.use((req, res) => {
    res.status(404).json(ErrorCatalog.RECURSO_NO_ENCONTRADO);
  });

  app.use(errorHandler);

  return app;
}
