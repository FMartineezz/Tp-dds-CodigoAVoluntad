import habilidadRoutes from "./habilidadRoutes.js"
import proyectoRoutes from "./proyectoroutes.js"
// import proyectoRoutes from "./proyectoRoutes.js";
// import colectivoRoutes from "./colectivoRoutes.js";
// import colaboradoraRoutes from "./colaboradoraRoutes.js";
// import colaboracionRoutes from "./colaboracionRoutes.js";

const routes = [
    habilidadRoutes(),
    proyectoRoutes()
]

export default routes