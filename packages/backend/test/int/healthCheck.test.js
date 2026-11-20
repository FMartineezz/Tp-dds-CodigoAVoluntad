import request from "supertest";
import { app } from "./utils/app.js";
import { usarBaseDeDatos } from "../utils/db.js";

usarBaseDeDatos();

describe("App", () => {
  test("GET /healthCheck responde 200", async () => {
    const respuesta = await request(app).get("/healthCheck");
    expect(respuesta.status).toBe(200);
  });

  test("una ruta inexistente responde 404 con el error del catálogo", async () => {
    const respuesta = await request(app).get("/no-existe");
    expect(respuesta.status).toBe(404);
    expect(respuesta.body.code).toBeDefined();
  });
});
