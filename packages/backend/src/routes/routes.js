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

const routes = [
  habilidadRoutes(),
  proyectoRoutes(),
  colectivoRoutes(),
  personaColaboradoraRoutes(),
  colaboracionRoutes(),
  healthCheckRoutes(),
  perfilRoutes(),
  logroRoutes(),
  valoracionRoutes(),
  swaggerRoutes(),
];

export default routes;
