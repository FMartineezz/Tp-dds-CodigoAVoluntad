import "dotenv/config";
import routes from "./src/routes/routes.js";
import { buildApp } from "./src/app.js";
import { MongoDBClient } from "./config/database.js";
import { cierreProyectos } from "./src/container.js";

const port = process.env.SERVER_PORT || 3000;

const app = buildApp(routes);

MongoDBClient.connect();

cierreProyectos.iniciar();

app.listen(port, () => {
  console.log("Backend escuchando en puerto " + port);
});
