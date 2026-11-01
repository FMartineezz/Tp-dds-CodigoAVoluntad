import request from "supertest";
import ErrorCatalog from "../../src/errors/errorCatalog.js";
import { buildTestApp } from "./utils/buildTestApp.js";

const ana = { _id: "pc1", nombreFantasia: "Ana", habilidades: ["h-react"], contactos: [] };

const proyecto = (cambios = {}) => ({
  _id: "p1",
  titulo: "Web institucional",
  colectivo: { nombre: "Fundación Ejemplo" },
  finalizado: false,
  perfiles: [{ habilidadesRequeridas: ["h-react"] }],
  ...cambios,
});

describe("Colaboraciones", () => {
  let app;
  let repos;

  beforeEach(() => {
    ({ app, repos } = buildTestApp());
  });

  // Las colaboraciones ya no se crean por POST: nacen de postulaciones aceptadas
  describe("DELETE /colaboraciones/:id", () => {
    test("responde 200 y desactiva la colaboración", async () => {
      // Preparación
      repos.colaboracion.obtenerPorId.mockResolvedValue({ _id: "col1", activo: true });
      repos.colaboracion.desactivar.mockResolvedValue();

      // Ejecución
      const respuesta = await request(app).delete("/colaboraciones/col1");

      // Validación
      expect(respuesta.status).toBe(200);
      expect(respuesta.body).toEqual({ message: "Colaboración desactivada correctamente" });
      expect(repos.colaboracion.desactivar).toHaveBeenCalledWith("col1");
    });

    test("responde 404 si la colaboración no existe", async () => {
      repos.colaboracion.obtenerPorId.mockResolvedValue(null);

      const respuesta = await request(app).delete("/colaboraciones/inexistente");

      expect(respuesta.status).toBe(404);
      expect(respuesta.body.code).toBe(ErrorCatalog.COLABORACION_NO_ENCONTRADA.code);
      expect(repos.colaboracion.desactivar).not.toHaveBeenCalled();
    });

    test("responde 409 si la colaboración ya estaba dada de baja", async () => {
      repos.colaboracion.obtenerPorId.mockResolvedValue({ _id: "col1", activo: false });

      const respuesta = await request(app).delete("/colaboraciones/col1");

      expect(respuesta.status).toBe(409);
      expect(respuesta.body.code).toBe(ErrorCatalog.COLABORACION_YA_DADA_DE_BAJA.code);
      expect(repos.colaboracion.desactivar).not.toHaveBeenCalled();
    });
  });

  test("GET /colaboraciones responde 200 con lo que devuelve el repositorio", async () => {
    // Preparación (la ocultación de la persona en las anónimas la hace la proyección del repositorio)
    repos.colaboracion.obtenerTodas.mockResolvedValue([
      { _id: "col1", anonima: true, personaColaboradora: null, proyecto: proyecto() },
      { _id: "col2", anonima: false, personaColaboradora: ana, proyecto: proyecto() },
    ]);

    // Ejecución
    const respuesta = await request(app).get("/colaboraciones");

    // Validación
    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toHaveLength(2);
    expect(respuesta.body[0].personaColaboradora).toBeNull();
    expect(respuesta.body[1].personaColaboradora._id).toBe("pc1");
  });

  test("GET /colaboraciones/:id responde 404 si no existe", async () => {
    repos.colaboracion.obtenerPorId.mockResolvedValue(null);

    const respuesta = await request(app).get("/colaboraciones/inexistente");

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.code).toBe(ErrorCatalog.COLABORACION_NO_ENCONTRADA.code);
  });
});
