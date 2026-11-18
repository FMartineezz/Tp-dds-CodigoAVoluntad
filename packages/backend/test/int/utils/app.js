import routes from "../../../src/routes/routes.js";
import { buildApp } from "../../../src/app.js";

// La misma app que levanta index.js (mismas rutas, container y middlewares), sin mocks:
// los controllers usan los services y repositorios reales contra la base de test.
export const app = buildApp(routes);
