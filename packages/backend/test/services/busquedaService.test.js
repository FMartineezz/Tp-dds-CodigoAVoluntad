import { jest } from "@jest/globals";
import ErrorCatalog from "../../src/errors/errorCatalog.js";
import {
  crearContexto,
  cargarEscenarioBase,
  perfilDeEjemplo,
  expectAppError,
} from "../helpers/crearContexto.js";

describe("BusquedaService", () => {
  let ctx;
  let escenario;
  let ana;
  let beto;

  beforeEach(async () => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    ctx = crearContexto();
    escenario = await cargarEscenarioBase(ctx);
    ana = await ctx.personaColaboradoraService.crearPersonaColaboradora(
      "Ana",
      "github.com/ana",
      null,
      null,
      ["desarrollo_web_react"],
      null,
      "Hola",
      [{ tipo: "email", valor: "ana@mail.com" }],
    );
    beto = await ctx.personaColaboradoraService.crearPersonaColaboradora(
      "Beto",
      "github.com/beto",
      null,
      null,
      ["testing_e_2_e"],
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("colaboradoras acordes a un perfil", () => {
    test("devuelve quienes tienen alguna habilidad requerida, sin contactos", async () => {
      const [perfil] = await ctx.proyectoService.obtenerPerfiles(escenario.proyecto.id);

      const personas = await ctx.busquedaService.obtenerPersonasColaboradorasAcordesAPerfil(
        escenario.proyecto.id,
        perfil._id,
      );

      // Beto solo tiene una habilidad opcional del perfil, así que no aparece
      expect(personas.map((p) => p.nombreFantasia)).toEqual(["Ana"]);
      expect(personas[0]).not.toHaveProperty("contactos");
    });

    test("falla con 404 si el perfil no existe", async () => {
      await expectAppError(
        ctx.busquedaService.obtenerPersonasColaboradorasAcordesAPerfil(
          escenario.proyecto.id,
          "inexistente",
        ),
        ErrorCatalog.PERFIL_NO_ENCONTRADO,
        404,
      );
    });
  });

  describe("proyectos acordes a una colaboradora", () => {
    test("devuelve los proyectos con algún perfil que requiera sus habilidades", async () => {
      await ctx.proyectoService.crearProyecto(
        "App de testing",
        "d",
        [perfilDeEjemplo({ habilidadesRequeridas: ["testing_e_2_e"] })],
        "Fundación Ejemplo",
        "https://app.org",
      );

      const paraAna = await ctx.busquedaService.obtenerProyectosAcordesALaPersonaColaboradora(
        ana.id,
      );
      const paraBeto = await ctx.busquedaService.obtenerProyectosAcordesALaPersonaColaboradora(
        beto.id,
      );

      expect(paraAna.map((p) => p.titulo)).toEqual(["Web institucional"]);
      expect(paraBeto.map((p) => p.titulo)).toEqual(["App de testing"]);
    });

    test("no incluye proyectos finalizados", async () => {
      await ctx.proyectoService.finalizarProyecto(escenario.proyecto.id);

      expect(
        await ctx.busquedaService.obtenerProyectosAcordesALaPersonaColaboradora(ana.id),
      ).toEqual([]);
    });

    test("falla con 404 si la colaboradora no existe", async () => {
      await expectAppError(
        ctx.busquedaService.obtenerProyectosAcordesALaPersonaColaboradora("inexistente"),
        ErrorCatalog.COLABORADORA_NO_ENCONTRADA,
        404,
      );
    });
  });
});
