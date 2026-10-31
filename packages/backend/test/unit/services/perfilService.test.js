import { jest } from "@jest/globals";
import { PerfilService } from "../../../src/services/perfilService.js";
import { Perfil } from "../../../src/models/perfil.js";
import { AppError } from "../../../src/errors/appError.js";
import ErrorCatalog from "../../../src/errors/errorCatalog.js";
import { esperarAppError } from "../../utils/esperarAppError.js";

// Simula a HabilidadService: cada código existe salvo "cobol"
const buscarHabilidad = async (codigo) => {
  if (codigo === "cobol") {
    throw new AppError(ErrorCatalog.HABILIDAD_INEXISTENTE_GENERICO, 400, codigo);
  }
  return { _id: `id-${codigo}`, codigo };
};

describe("PerfilService", () => {
  let mockHabilidadService;
  let perfilService;

  beforeEach(() => {
    mockHabilidadService = { obtenerHabilidadPorCodigo: jest.fn(buscarHabilidad) };
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
      );

      // Validación
      expect(mockHabilidadService.obtenerHabilidadPorCodigo).toHaveBeenCalledTimes(3);
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
      });
    });

    test.each([
      ["requerida", ["cobol"], ["react"]],
      ["opcional", ["react"], ["cobol"]],
    ])("falla si una habilidad %s no existe", async (_, requeridas, opcionales) => {
      await esperarAppError(
        perfilService.crearPerfil("d", requeridas, opcionales, 5, "mensual", "gratuita"),
        ErrorCatalog.HABILIDAD_INEXISTENTE_GENERICO,
        400,
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

      // Validación
      expect(cambios).toEqual({ descripcion: "Nueva", horas: 8 });
      expect(mockHabilidadService.obtenerHabilidadPorCodigo).not.toHaveBeenCalled();
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
        ErrorCatalog.HABILIDAD_INEXISTENTE_GENERICO,
        400,
      );
    });
  });
});
