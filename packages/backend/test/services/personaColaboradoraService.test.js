import ErrorCatalog from "../../src/errors/errorCatalog.js";
import { crearContexto, expectAppError } from "../helpers/crearContexto.js";

const contactos = [
  { tipo: "email", valor: "ana@mail.com" },
  { tipo: "sms", valor: "1127891234" },
];

describe("PersonaColaboradoraService", () => {
  let ctx;
  let react;

  const crearAna = () =>
    ctx.personaColaboradoraService.crearPersonaColaboradora(
      "Ana",
      "github.com/ana",
      null,
      null,
      ["desarrollo_web_react"],
      null,
      "Hola",
      contactos,
      false,
    );

  beforeEach(async () => {
    ctx = crearContexto();
    react = await ctx.habilidadService.crearHabilidad("Desarrollo Web React", "d");
  });

  describe("crearPersonaColaboradora", () => {
    test("resuelve los códigos de habilidad a habilidades existentes", async () => {
      const ana = await crearAna();

      expect(ana.habilidades).toEqual([
        expect.objectContaining({ codigo: "desarrollo_web_react" }),
      ]);
      expect(typeof ana.id).toBe("string");
    });

    test("falla con 400 si alguna habilidad no existe", async () => {
      await expectAppError(
        ctx.personaColaboradoraService.crearPersonaColaboradora("Beto", "g", null, null, ["cobol"]),
        ErrorCatalog.HABILIDAD_INEXISTENTE_GENERICO,
        400,
      );
    });
  });

  describe("los medios de contacto no se exponen públicamente", () => {
    test("obtenerPersonaColaboradoraPorId oculta los contactos", async () => {
      const ana = await crearAna();

      const vista = await ctx.personaColaboradoraService.obtenerPersonaColaboradoraPorId(ana.id);

      expect(vista.nombreFantasia).toBe("Ana");
      expect(vista).not.toHaveProperty("contactos");
    });

    test("obtenerPersonasColaboradoras oculta los contactos", async () => {
      await crearAna();

      const [vista] = await ctx.personaColaboradoraService.obtenerPersonasColaboradoras();

      expect(vista).not.toHaveProperty("contactos");
    });

    test("internamente se pueden obtener con contactos", async () => {
      const ana = await crearAna();

      const interna =
        await ctx.personaColaboradoraService.obtenerPersonaColaboradoraPorIdConContactos(ana.id);

      expect(interna.contactos).toEqual(contactos);
    });
  });

  test("obtenerPersonaColaboradoraPorId falla con 404 si no existe", async () => {
    await expectAppError(
      ctx.personaColaboradoraService.obtenerPersonaColaboradoraPorId("inexistente"),
      ErrorCatalog.COLABORADORA_NO_ENCONTRADA,
      404,
    );
  });

  test("obtenerPersonasConAlgunaHabilidad filtra por id de habilidad y oculta contactos", async () => {
    await crearAna();
    await ctx.habilidadService.crearHabilidad("Python", "d");
    await ctx.personaColaboradoraService.crearPersonaColaboradora("Beto", "g", null, null, [
      "python",
    ]);

    const personas = await ctx.personaColaboradoraService.obtenerPersonasConAlgunaHabilidad([
      react.id,
    ]);

    expect(personas.map((p) => p.nombreFantasia)).toEqual(["Ana"]);
    expect(personas[0]).not.toHaveProperty("contactos");
  });
});
