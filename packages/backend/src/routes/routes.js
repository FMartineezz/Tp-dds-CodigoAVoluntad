import habilidadRoutes from "./habilidadRoutes.js"
import proyectoRoutes from "./proyectoRoutes.js"
import colectivoRoutes from "./colectivoRoutes.js"
import personaColaboradoraRoutes from "./personaColaboradoraRoutes.js"
import colaboracionRoutes from "./colaboracionRoutes.js"
import healthCheckRoutes from "./healthCheckRoutes.js";

const routes = [
    habilidadRoutes(),
    proyectoRoutes(),
    colectivoRoutes(),
    personaColaboradoraRoutes(),
    colaboracionRoutes(),
    healthCheckRoutes()
]

export default routes