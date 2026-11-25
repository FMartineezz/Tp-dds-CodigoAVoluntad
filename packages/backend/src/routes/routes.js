import habilidadRoutes from "./habilidadRoutes.js";
import proyectoRoutes from "./proyectoRoutes.js";
import colectivoRoutes from "./colectivoRoutes.js";
import personaColaboradoraRoutes from "./personaColaboradoraRoutes.js";
import colaboracionRoutes from "./colaboracionRoutes.js";
import healthCheckRoutes from "./healthCheckRoutes.js";
import perfilRoutes from "./perfilRoutes.js";
import logroRoutes from "./logroRoutes.js";
import valoracionRoutes from "./valoracionRoutes.js";
import swaggerRoutes from "./swaggerRoutes.js";
import estadisticasRoutes from "./estadisticasRoutes.js";
import postulacionRoutes from "./postulacionRoutes.js";
import denunciaRoutes from "./denunciaRoutes.js";
import notificacionRoute from "./notificacionRoutes.js";
import mensajeRoutes from "./mensajeRoutes.js";
import reporteRoutes from "./reporteRoutes.js";

/**
 * Todos los routers de la API, en el orden en que se montan en la app (ver buildApp).
 * @type {import("express").Router[]}
 */
const routes = [
  habilidadRoutes(),
  proyectoRoutes(),
  colectivoRoutes(),
  personaColaboradoraRoutes(),
  colaboracionRoutes(),
  healthCheckRoutes(),
  perfilRoutes(),
  estadisticasRoutes(),
  logroRoutes(),
  valoracionRoutes(),
  swaggerRoutes(),
  postulacionRoutes(),
  denunciaRoutes(),
  notificacionRoute(),
  mensajeRoutes(),
  reporteRoutes(),
];

export default routes;
