import ErrorCatalog from "../../src/errors/errorCatalog.js";
import { Perfil } from "../../src/models/perfil.js";
import { crearContexto, expectAppError } from "../helpers/crearContexto.js";

describe("PerfilService", () => {
  let ctx;

  beforeEach(async () => {
    ctx = crearContexto();
    await ctx.habilidadService.crearHabilidad("Testing E2E con Cypress", "d");
    await ctx.habilidadService.crearHabilidad("Uso de Soap UI", "d");
  });

  test("crea un perfil resolviendo habilidades requeridas y opcionales", async () => {
    const perfil = await ctx.perfilService.crearPerfil(
      "Tester",
      ["testing_e_2_e_con_cypress"],
      ["uso_de_soap_ui"],
      5,
      "mensual",
      "gratuita",
    );

    expect(perfil).toBeInstanceOf(Perfil);
    expect(perfil.habilidadesRequeridas.map((h) => h.titulo)).toEqual(["Testing E2E con Cypress"]);
    expect(perfil.habilidadesOpcionales.map((h) => h.titulo)).toEqual(["Uso de Soap UI"]);
    expect(perfil).toMatchObject({ horas: 5, tipoDeCompromiso: "mensual" });
  });

  test("falla si una habilidad requerida no existe", async () => {
    await expectAppError(
      ctx.perfilService.crearPerfil("Analista", ["pandas"], ["uso_de_soap_ui"], 15, "mensual"),
      ErrorCatalog.HABILIDAD_INEXISTENTE_GENERICO,
      400,
    );
  });

  test("falla si una habilidad opcional no existe", async () => {
    await expectAppError(
      ctx.perfilService.crearPerfil("Tester", ["uso_de_soap_ui"], ["pandas"], 5, "mensual"),
      ErrorCatalog.HABILIDAD_INEXISTENTE_GENERICO,
      400,
    );
  });
});
