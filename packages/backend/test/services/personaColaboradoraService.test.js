import mongoose from "mongoose";
import { habilidadService, personaColaboradoraService } from "../../src/container.js";
import ErrorCatalog from "../../src/errors/errorCatalog.js";
import { PersonaColaboradoraModel } from "../../src/schemas/personaColaboradoraSchema.js";
import { consultasA, usarBaseDeDatos } from "../utils/db.js";
import { esperarAppError } from "../utils/esperarAppError.js";

usarBaseDeDatos();

const idInexistente = () => new mongoose.Types.ObjectId().toString();

const contactos = [
  { tipo: "email", valor: "ada@mail.com" },
  { tipo: "whatsapp", valor: "1127891234" },
];

const crearPersona = ({
  nombreFantasia = "ada",
  habilidades = ["node"],
  redesSociales = [],
  bloquearMensajeInterno = false,
} = {}) =>
  personaColaboradoraService.crearPersonaColaboradora(
    nombreFantasia,
    `github:${nombreFantasia}`,
    "Ada",
    "Lovelace",
    habilidades,
    ["ella"],
    "Programadora",
    contactos,
    bloquearMensajeInterno,
    redesSociales,
  );

describe("PersonaColaboradoraService", () => {
  let node;
  let react;

  beforeEach(async () => {
    node = await habilidadService.crearHabilidad("Node", "Backend");
    react = await habilidadService.crearHabilidad("React", "Frontend");
  });

  describe("crearPersonaColaboradora", () => {
    test("busca todas sus habilidades con una sola consulta (sin N+1)", async () => {
      // Ejecución
      const consultas = await consultasA("habilidades", () =>
        crearPersona({ habilidades: ["node", "react"] }),
      );

      // Validación: una única consulta a habilidades, no un findOne por cada una
      expect(consultas).toEqual(["find"]);
    });

    test("persiste la persona con las habilidades resueltas por código", async () => {
      // Ejecución
      const persona = await crearPersona({ habilidades: ["node", "react"] });

      // Validación
      expect(persona.id).toBeDefined();
      expect(persona).toMatchObject({ nombreFantasia: "ada", git: "github:ada", activo: true });
      expect(persona.habilidades.map((h) => h.codigo)).toEqual(["node", "react"]);
      const guardada = await PersonaColaboradoraModel.findById(persona.id)
        .select("+contactos")
        .lean();
      expect(guardada.habilidades.map(String)).toEqual([node.id, react.id]);
      expect(guardada.contactos).toEqual(contactos);
      expect(guardada.pronombres).toEqual(["ella"]);
    });

    test("normaliza las redes sociales", async () => {
      // Ejecución
      const persona = await crearPersona({
        redesSociales: [{ tipo: "GitHub", url: " https://github.com/ada " }],
      });

      // Validación
      const guardada = await PersonaColaboradoraModel.findById(persona.id).lean();
      expect(guardada.redesSociales).toEqual([{ tipo: "github", url: "https://github.com/ada" }]);
    });

    test("rechaza con 400 redes sociales duplicadas", async () => {
      // Ejecución y Validación
      await esperarAppError(
        crearPersona({
          redesSociales: [
            { tipo: "linkedin", url: "https://linkedin.com/a" },
            { tipo: "LINKEDIN", url: "https://linkedin.com/b" },
          ],
        }),
        ErrorCatalog.RED_SOCIAL_TIPO_DUPLICADO,
        400,
      );
      expect(await PersonaColaboradoraModel.countDocuments()).toBe(0);
    });

    test("rechaza con 400 habilidades inexistentes sin guardar nada", async () => {
      // Ejecución y Validación
      await esperarAppError(
        crearPersona({ habilidades: ["node", "cobol"] }),
        ErrorCatalog.HABILIDADES_INEXISTENTES_GENERICO,
        400,
      );
      expect(await PersonaColaboradoraModel.countDocuments()).toBe(0);
    });

    // BUG: la validación acepta habilidades: [] pero el schema exige al menos una; el
    // ValidationError de mongoose no es AppError y termina en 500.
    test.failing("rechaza con 400 una persona sin habilidades", async () => {
      // Ejecución y Validación
      await esperarAppError(
        crearPersona({ habilidades: [] }),
        ErrorCatalog.COLABORADORA_HABILIDADES_REQUERIDAS,
        400,
      );
    });
  });

  describe("obtener", () => {
    test("obtenerPersonasColaboradoras lista las personas sin contactos", async () => {
      // Preparación
      await crearPersona({ nombreFantasia: "ada" });
      await crearPersona({ nombreFantasia: "grace" });

      // Ejecución
      const { resultados: personas } =
        await personaColaboradoraService.obtenerPersonasColaboradoras({ pagina: 1, limite: 20 });

      // Validación
      expect(personas.map((p) => p.nombreFantasia).sort()).toEqual(["ada", "grace"]);
      personas.forEach((persona) => expect(persona).not.toHaveProperty("contactos"));
    });

    test("obtenerPersonaColaboradoraPorId devuelve la persona sin contactos", async () => {
      // Preparación
      const creada = await crearPersona();

      // Ejecución
      const persona = await personaColaboradoraService.obtenerPersonaColaboradoraPorId(creada.id);

      // Validación
      expect(persona.nombreFantasia).toBe("ada");
      expect(persona).not.toHaveProperty("contactos");
    });

    test("obtenerPersonaColaboradoraPorIdConContactos incluye los contactos", async () => {
      // Preparación
      const creada = await crearPersona();

      // Ejecución
      const persona = await personaColaboradoraService.obtenerPersonaColaboradoraPorIdConContactos(
        creada.id,
      );

      // Validación
      expect(persona.contactos).toEqual(contactos);
    });

    test.each([
      ["obtenerPersonaColaboradoraPorId"],
      ["obtenerPersonaColaboradoraPorIdConContactos"],
    ])("%s falla con 404 si no existe", async (metodo) => {
      // Ejecución y Validación
      await esperarAppError(
        personaColaboradoraService[metodo](idInexistente()),
        ErrorCatalog.COLABORADORA_NO_ENCONTRADA,
        404,
      );
    });

    test("obtenerPersonasConAlgunaHabilidad devuelve las que tienen al menos una", async () => {
      // Preparación
      await crearPersona({ nombreFantasia: "ada", habilidades: ["node"] });
      await crearPersona({ nombreFantasia: "grace", habilidades: ["react"] });
      await crearPersona({ nombreFantasia: "linus", habilidades: ["node", "react"] });

      // Ejecución
      const personas = await personaColaboradoraService.obtenerPersonasConAlgunaHabilidad([
        node.id,
      ]);

      // Validación
      expect(personas.map((p) => p.nombreFantasia).sort()).toEqual(["ada", "linus"]);
    });

    test("ocultarContactos quita los contactos y conserva el resto", () => {
      // Ejecución
      const resultado = personaColaboradoraService.ocultarContactos({
        nombreFantasia: "ada",
        contactos,
      });

      // Validación
      expect(resultado).toEqual({ nombreFantasia: "ada" });
    });
  });

  describe("actualizarPersonaColaboradora", () => {
    test("actualiza los campos enviados y resuelve las habilidades por código", async () => {
      // Preparación
      const creada = await crearPersona({ habilidades: ["node"] });

      // Ejecución
      const actualizada = await personaColaboradoraService.actualizarPersonaColaboradora(
        creada.id,
        { presentacion: "Nueva presentación", habilidades: ["react"] },
      );

      // Validación
      expect(actualizada).toMatchObject({
        nombreFantasia: "ada",
        presentacion: "Nueva presentación",
      });
      expect(actualizada.habilidades.map(String)).toEqual([react.id]);
    });

    test("actualiza los contactos sin exponerlos en la respuesta", async () => {
      // Preparación
      const creada = await crearPersona();
      const nuevosContactos = [{ tipo: "sms", valor: "1100000000" }];

      // Ejecución
      const actualizada = await personaColaboradoraService.actualizarPersonaColaboradora(
        creada.id,
        { contactos: nuevosContactos },
      );

      // Validación
      expect(actualizada).not.toHaveProperty("contactos");
      const conContactos =
        await personaColaboradoraService.obtenerPersonaColaboradoraPorIdConContactos(creada.id);
      expect(conContactos.contactos).toEqual(nuevosContactos);
    });

    test("reemplaza las redes sociales normalizadas", async () => {
      // Preparación
      const creada = await crearPersona();

      // Ejecución
      const actualizada = await personaColaboradoraService.actualizarPersonaColaboradora(
        creada.id,
        { redesSociales: [{ tipo: "X", url: "https://x.com/ada" }] },
      );

      // Validación
      expect(actualizada.redesSociales).toEqual([{ tipo: "x", url: "https://x.com/ada" }]);
    });

    test("rechaza con 400 redes sociales duplicadas", async () => {
      // Preparación
      const creada = await crearPersona();

      // Ejecución y Validación
      await esperarAppError(
        personaColaboradoraService.actualizarPersonaColaboradora(creada.id, {
          redesSociales: [
            { tipo: "github", url: "https://github.com/a" },
            { tipo: "github", url: "https://github.com/b" },
          ],
        }),
        ErrorCatalog.RED_SOCIAL_TIPO_DUPLICADO,
        400,
      );
    });

    test("rechaza con 400 habilidades inexistentes y no modifica la persona", async () => {
      // Preparación
      const creada = await crearPersona({ habilidades: ["node"] });

      // Ejecución y Validación
      await esperarAppError(
        personaColaboradoraService.actualizarPersonaColaboradora(creada.id, {
          habilidades: ["cobol"],
        }),
        ErrorCatalog.HABILIDADES_INEXISTENTES_GENERICO,
        400,
      );
      const guardada = await PersonaColaboradoraModel.findById(creada.id).lean();
      expect(guardada.habilidades.map(String)).toEqual([node.id]);
    });

    test.each([[{}], [null]])("rechaza con 400 cambios vacíos (%j)", async (cambios) => {
      // Preparación
      const creada = await crearPersona();

      // Ejecución y Validación
      await esperarAppError(
        personaColaboradoraService.actualizarPersonaColaboradora(creada.id, cambios),
        ErrorCatalog.ARGUMENTO_INVALIDO,
        400,
      );
    });

    test("falla con 404 si la persona no existe", async () => {
      // Ejecución y Validación
      await esperarAppError(
        personaColaboradoraService.actualizarPersonaColaboradora(idInexistente(), {
          presentacion: "x",
        }),
        ErrorCatalog.COLABORADORA_NO_ENCONTRADA,
        404,
      );
    });
  });

  describe("eliminarPersonaColaboradora", () => {
    // BUG: PersonaColaboradoraService no tiene el método eliminarPersonaColaboradora (que usa el
    // controller de DELETE /colaboradoras/:id), aunque el repositorio ya implementa `eliminar`
    // con la anonimización. Todas estas pruebas fallan con "is not a function".
    test.failing("anonimiza los datos personales y la da de baja", async () => {
      // Preparación
      const creada = await crearPersona();

      // Ejecución
      await personaColaboradoraService.eliminarPersonaColaboradora(creada.id);

      // Validación
      const guardada = await PersonaColaboradoraModel.findById(creada.id)
        .select("+contactos +activo")
        .lean();
      expect(guardada).toMatchObject({
        nombreFantasia: "UserEliminado",
        git: `github:UserEliminado${creada.id}`,
        nombre: "Usuario",
        apellido: "Eliminado",
        pronombres: [],
        contactos: [],
        activo: false,
      });
    });

    // BUG: ver arriba, falta eliminarPersonaColaboradora en el service.
    test.failing("falla con 409 si ya estaba dada de baja", async () => {
      // Preparación
      const creada = await crearPersona();
      await personaColaboradoraService.eliminarPersonaColaboradora(creada.id);

      // Ejecución y Validación
      await esperarAppError(
        personaColaboradoraService.eliminarPersonaColaboradora(creada.id),
        ErrorCatalog.COLABORADORA_YA_DADA_DE_BAJA,
        409,
      );
    });

    // BUG: ver arriba, falta eliminarPersonaColaboradora en el service.
    test.failing("falla con 404 si no existe", async () => {
      // Ejecución y Validación
      await esperarAppError(
        personaColaboradoraService.eliminarPersonaColaboradora(idInexistente()),
        ErrorCatalog.COLABORADORA_NO_ENCONTRADA,
        404,
      );
    });
  });
});
