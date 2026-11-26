import request from "supertest";
import { app } from "./utils/app.js";
import { usarBaseDeDatos } from "../utils/db.js";
import { armarEscenario, idInexistente } from "../utils/escenarios.js";
import ErrorCatalog from "../../src/errors/errorCatalog.js";

usarBaseDeDatos();

// Las reglas de acceso se prueban en el service; acá solo que la ruta esté bien conectada
describe("GET /colaboradoras/:id/contactos (HTTP)", () => {
  const contactos = [{ tipo: "email", valor: "ana@mail.com" }];

  test("la dueña recibe 200 con sus contactos", async () => {
    // Preparación
    const { personaId } = await armarEscenario({ contactos });

    // Ejecución
    const respuesta = await request(app)
      .get(`/colaboradoras/${personaId}/contactos`)
      .query({ colaboradoraId: personaId });

    // Validación
    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual(contactos);
  });

  test("sin acceso responde 403", async () => {
    // Preparación
    const { personaId } = await armarEscenario({ contactos });

    // Ejecución
    const respuesta = await request(app).get(`/colaboradoras/${personaId}/contactos`);

    // Validación
    expect(respuesta.status).toBe(403);
    expect(respuesta.body.code).toBe(ErrorCatalog.COLABORADORA_CONTACTOS_SIN_ACCESO.code);
  });

  test("responde 404 si la persona no existe", async () => {
    // Ejecución
    const respuesta = await request(app).get(`/colaboradoras/${idInexistente()}/contactos`);

    // Validación
    expect(respuesta.status).toBe(404);
  });
});
