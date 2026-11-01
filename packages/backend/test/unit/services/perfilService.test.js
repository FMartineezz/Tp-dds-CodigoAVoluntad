import { jest } from "@jest/globals";
import { PerfilService } from "../../../src/services/perfilService.js";
import { Perfil } from "../../../src/models/perfil.js";
import ErrorCatalog from "../../../src/errors/errorCatalog.js";
import { esperarAppError } from "../../utils/esperarAppError.js";

// Simula a HabilidadService: busca todos los códigos juntos y devuelve solo los que existen.
// Todos existen salvo "cobol" y "fortran".
const buscarHabilidades = async (codigos) =>
  codigos
    .filter((codigo) => codigo !== "cobol" && codigo !== "fortran")
    .map((codigo) => ({ _id: `id-${codigo}`, codigo }));

describe("PerfilService", () => {
  let mockHabilidadService;
  let perfilService;

  beforeEach(() => {
    mockHabilidadService = { obtenerHabilidadesPorCodigos: jest.fn(buscarHabilidades) };
    perfilService = new PerfilService({ habilidadService: mockHabilidadService });
  });

  describe("crearPerfil", () => {
    test("resuelve los códigos de habilidades requeridas y opcionales", async () => {
      // Ejecución
      const perfil = await perfilService.crearPerfil(
        "Desarrollo front",
        ["react"],
        ["cypress", "figma"],
        5,
        "mensual",
        "gratuita",
        3,
      );

      // Validación
      expect(perfil).toBeInstanceOf(Perfil);
      expect(perfil).toMatchObject({
        descripcion: "Desarrollo front",
        habilidadesRequeridas: [{ _id: "id-react", codigo: "react" }],
        habilidadesOpcionales: [
          { _id: "id-cypress", codigo: "cypress" },
          { _id: "id-figma", codigo: "figma" },
        ],
        horas: 5,
        tipoDeCompromiso: "mensual",
        modalidadDeColaboracion: "gratuita",
        cantidadMaxima: 3,
      });
    });

    test("busca todas las habilidades en una sola consulta", async () => {
      await perfilService.crearPerfil("d", ["react"], ["cypress", "figma"], 5, "mensual", "gratuita");

      expect(mockHabilidadService.obtenerHabilidadesPorCodigos).toHaveBeenCalledTimes(1);
      expect(mockHabilidadService.obtenerHabilidadesPorCodigos).toHaveBeenCalledWith([
        "react",
        "cypress",
        "figma",
      ]);
    });

    test.each([
      ["requerida", ["cobol"], ["react"]],
      ["opcional", ["react"], ["cobol"]],
    ])("falla si una habilidad %s no existe", async (_, requeridas, opcionales) => {
      await esperarAppError(
        perfilService.crearPerfil("d", requeridas, opcionales, 5, "mensual", "gratuita"),
        ErrorCatalog.HABILIDADES_INEXISTENTES_GENERICO,
        400,
      );
    });

    test("el mensaje de error lista todos los códigos que no existen", async () => {
      const resultado = perfilService.crearPerfil(
        "d",
        ["cobol", "react"],
        ["fortran"],
        5,
        "mensual",
        "gratuita",
      );

      await expect(resultado).rejects.toThrow(
        "Las habilidades de codigo: cobol, fortran no existen",
      );
    });
  });

  describe("prepararCambios", () => {
    test("convierte los códigos de habilidades en habilidades existentes", async () => {
      // Ejecución
      const cambios = await perfilService.prepararCambios({
        habilidadesRequeridas: ["react"],
        habilidadesOpcionales: ["figma"],
      });

      // Validación
      expect(cambios).toEqual({
        habilidadesRequeridas: [{ _id: "id-react", codigo: "react" }],
        habilidadesOpcionales: [{ _id: "id-figma", codigo: "figma" }],
      });
    });

    test("si no cambian las habilidades, no las busca y deja el resto intacto", async () => {
      // Ejecución
      const cambios = await perfilService.prepararCambios({ descripcion: "Nueva", horas: 8 });

      // Validación: sin listas vacías, que borrarían las habilidades que ya tiene el perfil
      expect(cambios).toEqual({ descripcion: "Nueva", horas: 8 });
      expect(mockHabilidadService.obtenerHabilidadesPorCodigos).not.toHaveBeenCalled();
    });

    test("si cambian solo las requeridas, no toca las opcionales", async () => {
      // Ejecución
      const cambios = await perfilService.prepararCambios({ habilidadesRequeridas: ["react"] });

      // Validación
      expect(cambios).toEqual({ habilidadesRequeridas: [{ _id: "id-react", codigo: "react" }] });
      expect(cambios).not.toHaveProperty("habilidadesOpcionales");
    });

    test("se pueden vaciar las habilidades opcionales enviando una lista vacía", async () => {
      const cambios = await perfilService.prepararCambios({ habilidadesOpcionales: [] });

      expect(cambios).toEqual({ habilidadesOpcionales: [] });
    });

    test("no modifica el objeto recibido", async () => {
      // Preparación
      const cambiosOriginales = { habilidadesRequeridas: ["react"] };

      // Ejecución
      await perfilService.prepararCambios(cambiosOriginales);

      // Validación
      expect(cambiosOriginales).toEqual({ habilidadesRequeridas: ["react"] });
    });

    test("falla con 400 si una habilidad no existe", async () => {
      await esperarAppError(
        perfilService.prepararCambios({ habilidadesOpcionales: ["cobol"] }),
        ErrorCatalog.HABILIDADES_INEXISTENTES_GENERICO,
        400,
      );
    });
  });
});
