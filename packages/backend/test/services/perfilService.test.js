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

  describe("prepararCambios", () => {
    test("convierte los códigos de habilidades en habilidades existentes", async () => {
      const cambios = await ctx.perfilService.prepararCambios({
        habilidadesRequeridas: ["testing_e_2_e_con_cypress"],
        habilidadesOpcionales: ["uso_de_soap_ui"],
      });

      expect(cambios.habilidadesRequeridas.map((h) => h.titulo)).toEqual([
        "Testing E2E con Cypress",
      ]);
      expect(cambios.habilidadesOpcionales.map((h) => h.titulo)).toEqual(["Uso de Soap UI"]);
    });

    test("deja intactos los demás campos y no agrega los que no vienen", async () => {
      const cambios = await ctx.perfilService.prepararCambios({ descripcion: "QA", horas: 3 });

      expect(cambios).toEqual({ descripcion: "QA", horas: 3 });
    });

    test("no modifica el objeto recibido", async () => {
      const recibidos = { habilidadesRequeridas: ["uso_de_soap_ui"] };

      await ctx.perfilService.prepararCambios(recibidos);

      expect(recibidos).toEqual({ habilidadesRequeridas: ["uso_de_soap_ui"] });
    });

    test("falla con 400 si una habilidad no existe", async () => {
      await expectAppError(
        ctx.perfilService.prepararCambios({ habilidadesRequeridas: ["pandas"] }),
        ErrorCatalog.HABILIDAD_INEXISTENTE_GENERICO,
        400,
      );
    });
  });
});
