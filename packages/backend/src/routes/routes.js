import habilidadRoutes from "./habilidadRoutes.js";
import proyectoRoutes from "./proyectoRoutes.js";
import colectivoRoutes from "./colectivoRoutes.js";
import personaColaboradoraRoutes from "./personaColaboradoraRoutes.js";
import colaboracionRoutes from "./colaboracionRoutes.js";
import healthCheckRoutes from "./healthCheckRoutes.js";
import perfilRoutes from "./perfilRoutes.js";

const routes = [
  habilidadRoutes(),
  proyectoRoutes(),
  colectivoRoutes(),
  personaColaboradoraRoutes(),
  colaboracionRoutes(),
  healthCheckRoutes(),
  perfilRoutes(),
];

export default routes;
