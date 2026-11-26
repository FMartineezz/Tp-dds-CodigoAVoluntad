import request from "supertest";
import { app } from "./utils/app.js";
import { usarBaseDeDatos } from "../utils/db.js";
import { crearColectivo } from "../utils/escenarios.js";

usarBaseDeDatos();

const darDeBaja = (id) => request(app).delete(`/colectivos/${id}`).expect(204);

describe("GET /admin/colectivos/bajas", () => {
  test("lista solo los colectivos dados de baja, el último primero", async () => {
    // Preparación: uno activo y dos dados de baja
    await crearColectivo("Sigue activo");
    const primero = await crearColectivo("Baja vieja");
    const segundo = await crearColectivo("Baja nueva");
    await darDeBaja(primero.id);
    await darDeBaja(segundo.id);

    // Ejecución
    const respuesta = await request(app).get("/admin/colectivos/bajas");

    // Validación
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.map((c) => c.nombre)).toEqual(["Baja nueva", "Baja vieja"]);
    expect(respuesta.body[0].updatedAt).toBeDefined();
  });

  test("devuelve una lista vacía si no hay bajas", async () => {
    await crearColectivo();

    const respuesta = await request(app).get("/admin/colectivos/bajas");

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual([]);
  });
});
