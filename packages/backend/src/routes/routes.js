import habilidadRoutes from "./habilidadRoutes.js"
import proyectoRoutes from "./proyectoRoutes.js"
import colectivoRoutes from "./colectivoRoutes.js"
// import colaboracionRoutes from "./colaboracionRoutes.js";

const routes = [
    habilidadRoutes(),
    proyectoRoutes(),
    colectivoRoutes()
]

export default routes