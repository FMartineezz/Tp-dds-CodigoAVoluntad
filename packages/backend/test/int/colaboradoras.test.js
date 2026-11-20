import request from "supertest";
import mongoose from "mongoose";
import { app } from "./utils/app.js";
import { usarBaseDeDatos } from "../utils/db.js";
import ErrorCatalog from "../../src/errors/errorCatalog.js";

usarBaseDeDatos();

const idInexistente = () => new mongoose.Types.ObjectId().toString();

const colaboradoraValida = (cambios = {}) => ({
  nombreFantasia: "ada",
  git: "github:ada",
  nombre: "Ada",
  apellido: "Lovelace",
  habilidades: ["node"],
  pronombres: ["ella"],
  presentacion: "Programadora",
  contactos: [{ tipo: "EMAIL", valor: "ada@mail.com" }],
  ...cambios,
});

const crearColaboradora = (body = colaboradoraValida()) =>
  request(app).post("/colaboradoras").send(body);

describe("Colaboradoras (HTTP)", () => {
  beforeEach(async () => {
    await request(app).post("/habilidades").send({ titulo: "Node", descripcion: "Backend" });
    await request(app).post("/habilidades").send({ titulo: "React", descripcion: "Frontend" });
  });

  describe("POST /colaboradoras", () => {
    test("crea la colaboradora y responde 201 con Location", async () => {
      // Ejecución
      const respuesta = await crearColaboradora(
        colaboradoraValida({
          habilidades: ["node", "react"],
          redesSociales: [{ tipo: "GitHub", url: "https://github.com/ada" }],
        }),
      );

      // Validación
      expect(respuesta.status).toBe(201);
      expect(respuesta.headers.location).toBe(`/colaboradoras/${respuesta.body.id}`);
      expect(respuesta.body).toMatchObject({
        nombreFantasia: "ada",
        git: "github:ada",
        bloquearMensajeInterno: false,
        redesSociales: [{ tipo: "github", url: "https://github.com/ada" }],
      });
      expect(respuesta.body.habilidades.map((h) => h.codigo)).toEqual(["node", "react"]);
    });

    test.each([
      [
        "sin nombre de fantasía",
        { nombreFantasia: undefined },
        ErrorCatalog.COLABORADORA_NOMBRE_FANTASIA_REQUERIDO,
      ],
      ["sin git", { git: undefined }, ErrorCatalog.COLABORADORA_GIT_REQUERIDO],
      [
        "sin habilidades",
        { habilidades: undefined },
        ErrorCatalog.COLABORADORA_HABILIDADES_REQUERIDAS,
      ],
      [
        "habilidades que no son lista",
        { habilidades: "node" },
        ErrorCatalog.COLABORADORA_HABILIDADES_FORMATO,
      ],
      [
        "habilidades que no son códigos",
        { habilidades: [1] },
        ErrorCatalog.COLABORADORA_HABILIDADES_FORMATO,
      ],
      [
        "sin presentación",
        { presentacion: undefined },
        ErrorCatalog.COLABORADORA_PRESENTACION_REQUERIDA,
      ],
      [
        "bloquearMensajeInterno no booleano",
        { bloquearMensajeInterno: "si" },
        ErrorCatalog.COLABORADORA_BLOQUEAR_MENSAJE_INTERNO_INVALIDO,
      ],
      ["contactos que no son lista", { contactos: "x" }, ErrorCatalog.MEDIO_CONTACTO_FORMATO],
      [
        "contacto con tipo inválido",
        { contactos: [{ tipo: "fax", valor: "1" }] },
        ErrorCatalog.MEDIO_CONTACTO_TIPO_INVALIDO,
      ],
      [
        "email inválido",
        { contactos: [{ tipo: "email", valor: "no-mail" }] },
        ErrorCatalog.MEDIO_CONTACTO_EMAIL_INVALIDO,
      ],
      [
        "teléfono inválido",
        { contactos: [{ tipo: "whatsapp", valor: "11 2789" }] },
        ErrorCatalog.MEDIO_CONTACTO_TELEFONO_INVALIDO,
      ],
      [
        "redes sociales duplicadas",
        {
          redesSociales: [
            { tipo: "github", url: "https://github.com/a" },
            { tipo: "GitHub", url: "https://github.com/b" },
          ],
        },
        ErrorCatalog.RED_SOCIAL_TIPO_DUPLICADO,
      ],
    ])("responde 400 %s", async (_caso, cambios, error) => {
      // Ejecución
      const respuesta = await crearColaboradora(colaboradoraValida(cambios));

      // Validación
      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe(error.code);
    });

    test("responde 400 si alguna habilidad no existe y no crea la colaboradora", async () => {
      // Ejecución
      const respuesta = await crearColaboradora(
        colaboradoraValida({ habilidades: ["node", "cobol"] }),
      );

      // Validación
      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe(ErrorCatalog.HABILIDADES_INEXISTENTES_GENERICO.code);
      const listado = await request(app).get("/colaboradoras");
      expect(listado.body.resultados).toEqual([]);
    });

    test("responde 400 si la lista de habilidades está vacía", async () => {
      // Ejecución
      const respuesta = await crearColaboradora(colaboradoraValida({ habilidades: [] }));

      // Validación
      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe(ErrorCatalog.COLABORADORA_HABILIDADES_REQUERIDAS.code);
    });
  });

  describe("GET /colaboradoras", () => {
    test("lista las colaboradoras sin exponer sus contactos", async () => {
      // Preparación
      await crearColaboradora(colaboradoraValida({ nombreFantasia: "ada" }));
      await crearColaboradora(colaboradoraValida({ nombreFantasia: "grace" }));

      // Ejecución
      const respuesta = await request(app).get("/colaboradoras");

      // Validación
      expect(respuesta.status).toBe(200);
      expect(respuesta.body.resultados.map((c) => c.nombreFantasia).sort()).toEqual([
        "ada",
        "grace",
      ]);
      respuesta.body.resultados.forEach((colaboradora) => {
        expect(colaboradora).not.toHaveProperty("contactos");
        expect(colaboradora).not.toHaveProperty("activo");
      });
    });
  });

  describe("GET /colaboradoras/:id", () => {
    test("devuelve la colaboradora sin contactos", async () => {
      // Preparación
      const creada = await crearColaboradora();

      // Ejecución
      const respuesta = await request(app).get(`/colaboradoras/${creada.body.id}`);

      // Validación
      expect(respuesta.status).toBe(200);
      expect(respuesta.body).toMatchObject({ _id: creada.body.id, nombreFantasia: "ada" });
      expect(respuesta.body).not.toHaveProperty("contactos");
    });

    test("responde 404 si no existe", async () => {
      // Ejecución
      const respuesta = await request(app).get(`/colaboradoras/${idInexistente()}`);

      // Validación
      expect(respuesta.status).toBe(404);
      expect(respuesta.body.code).toBe(ErrorCatalog.COLABORADORA_NO_ENCONTRADA.code);
    });

    test("responde 404 si el id no es un ObjectId válido", async () => {
      // Ejecución
      const respuesta = await request(app).get("/colaboradoras/no-es-un-id");

      // Validación
      expect(respuesta.status).toBe(404);
      expect(respuesta.body.code).toBe(ErrorCatalog.COLABORADORA_NO_ENCONTRADA.code);
    });
  });

  describe("PATCH /colaboradoras/:id", () => {
    test("edita los campos enviados y resuelve habilidades por código", async () => {
      // Preparación
      const creada = await crearColaboradora();
      const react = (await request(app).get("/habilidades")).body.find((h) => h.codigo === "react");

      // Ejecución
      const respuesta = await request(app)
        .patch(`/colaboradoras/${creada.body.id}`)
        .send({ presentacion: "Nueva", habilidades: ["react"], bloquearMensajeInterno: true });

      // Validación
      expect(respuesta.status).toBe(200);
      expect(respuesta.body).toMatchObject({
        nombreFantasia: "ada",
        presentacion: "Nueva",
        bloquearMensajeInterno: true,
        habilidades: [react._id],
      });
      expect(respuesta.body).not.toHaveProperty("contactos");
    });

    test.each([
      [{ habilidades: [] }, "COLABORADORA_HABILIDADES_REQUERIDAS"],
      [{ pronombres: "" }, "COLABORADORA_PRONOMBRES_FORMATO"],
      [{ pronombres: ["ella", " "] }, "COLABORADORA_PRONOMBRES_FORMATO"],
      [{ pronombres: 3 }, "COLABORADORA_PRONOMBRES_FORMATO"],
    ])("responde 400 con %j", async (cambios, error) => {
      const creada = await crearColaboradora();

      const respuesta = await request(app).patch(`/colaboradoras/${creada.body.id}`).send(cambios);

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe(ErrorCatalog[error].code);
    });

    test("acepta pronombres como texto o como lista", async () => {
      const creada = await crearColaboradora();

      const texto = await request(app)
        .patch(`/colaboradoras/${creada.body.id}`)
        .send({ pronombres: "ella/la" });
      const lista = await request(app)
        .patch(`/colaboradoras/${creada.body.id}`)
        .send({ pronombres: ["ella", "la"] });

      expect(texto.status).toBe(200);
      expect(lista.status).toBe(200);
      expect(lista.body.pronombres).toEqual(["ella", "la"]);
    });

    test("reemplaza las redes sociales normalizadas", async () => {
      // Preparación
      const creada = await crearColaboradora();

      // Ejecución
      const respuesta = await request(app)
        .patch(`/colaboradoras/${creada.body.id}`)
        .send({ redesSociales: [{ tipo: "LinkedIn", url: "https://linkedin.com/in/ada" }] });

      // Validación
      expect(respuesta.status).toBe(200);
      expect(respuesta.body.redesSociales).toEqual([
        { tipo: "linkedin", url: "https://linkedin.com/in/ada" },
      ]);
    });

    test.each([
      ["un body vacío", {}, ErrorCatalog.ARGUMENTO_INVALIDO],
      ["solo campos desconocidos", { campoInventado: 1 }, ErrorCatalog.ARGUMENTO_INVALIDO],
      ["un git vacío", { git: "" }, ErrorCatalog.COLABORADORA_GIT_REQUERIDO],
      [
        "un email inválido",
        { contactos: [{ tipo: "email", valor: "x" }] },
        ErrorCatalog.MEDIO_CONTACTO_EMAIL_INVALIDO,
      ],
      [
        "redes sociales duplicadas",
        {
          redesSociales: [
            { tipo: "x", url: "https://x.com/a" },
            { tipo: "X", url: "https://x.com/b" },
          ],
        },
        ErrorCatalog.RED_SOCIAL_TIPO_DUPLICADO,
      ],
    ])("responde 400 con %s", async (_caso, body, error) => {
      // Preparación
      const creada = await crearColaboradora();

      // Ejecución
      const respuesta = await request(app).patch(`/colaboradoras/${creada.body.id}`).send(body);

      // Validación
      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe(error.code);
    });

    test("responde 400 si alguna habilidad no existe y no modifica la colaboradora", async () => {
      // Preparación
      const creada = await crearColaboradora();

      // Ejecución
      const respuesta = await request(app)
        .patch(`/colaboradoras/${creada.body.id}`)
        .send({ habilidades: ["cobol"] });

      // Validación
      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe(ErrorCatalog.HABILIDADES_INEXISTENTES_GENERICO.code);
      const consulta = await request(app).get(`/colaboradoras/${creada.body.id}`);
      expect(consulta.body.habilidades).toHaveLength(1);
    });

    test("responde 404 si la colaboradora no existe", async () => {
      // Ejecución
      const respuesta = await request(app)
        .patch(`/colaboradoras/${idInexistente()}`)
        .send({ presentacion: "x" });

      // Validación
      expect(respuesta.status).toBe(404);
      expect(respuesta.body.code).toBe(ErrorCatalog.COLABORADORA_NO_ENCONTRADA.code);
    });
  });

  describe("DELETE /colaboradoras/:id", () => {
    // BUG: el controller llama a personaColaboradoraService.eliminarPersonaColaboradora, que no
    // existe: cualquier DELETE responde 500 ("is not a function") y la colaboradora no se anonimiza.
    test.failing("anonimiza a la colaboradora y responde 204", async () => {
      // Preparación
      const creada = await crearColaboradora();

      // Ejecución
      const respuesta = await request(app).delete(`/colaboradoras/${creada.body.id}`);

      // Validación
      expect(respuesta.status).toBe(204);
      const consulta = await request(app).get(`/colaboradoras/${creada.body.id}`);
      expect(consulta.body).toMatchObject({
        nombreFantasia: "UserEliminado",
        nombre: "Usuario",
        apellido: "Eliminado",
        pronombres: [],
      });
    });

    // BUG: ver arriba, falta el método del service.
    test.failing("responde 409 si la colaboradora ya fue dada de baja", async () => {
      // Preparación
      const creada = await crearColaboradora();
      await request(app).delete(`/colaboradoras/${creada.body.id}`);

      // Ejecución
      const respuesta = await request(app).delete(`/colaboradoras/${creada.body.id}`);

      // Validación
      expect(respuesta.status).toBe(409);
      expect(respuesta.body.code).toBe(ErrorCatalog.COLABORADORA_YA_DADA_DE_BAJA.code);
    });

    // BUG: ver arriba, falta el método del service.
    test.failing("responde 404 si la colaboradora no existe", async () => {
      // Ejecución
      const respuesta = await request(app).delete(`/colaboradoras/${idInexistente()}`);

      // Validación
      expect(respuesta.status).toBe(404);
      expect(respuesta.body.code).toBe(ErrorCatalog.COLABORADORA_NO_ENCONTRADA.code);
    });
  });
});
