import { jest } from "@jest/globals";
import { BusquedaService } from "../../../src/services/busquedaService.js";
import { AppError } from "../../../src/errors/appError.js";
import ErrorCatalog from "../../../src/errors/errorCatalog.js";
import { esperarAppError } from "../../utils/esperarAppError.js";

// Mongo devuelve las referencias como ObjectId; el service las pasa a string
const objectId = (id) => ({ toString: () => id });

describe("BusquedaService", () => {
  let mockProyectoService;
  let mockPersonaColaboradoraService;
  let busquedaService;

  beforeEach(() => {
    mockProyectoService = {
      obtenerPerfilPorId: jest.fn(),
      obtenerProyectosConAlgunaHabilidad: jest.fn(),
    };
    mockPersonaColaboradoraService = {
      obtenerPersonaColaboradoraPorId: jest.fn(),
      obtenerPersonasConAlgunaHabilidad: jest.fn(),
    };
    busquedaService = new BusquedaService({
      proyectoService: mockProyectoService,
      personaColaboradoraService: mockPersonaColaboradoraService,
    });
  });

  describe("obtenerPersonasColaboradorasAcordesAPerfil", () => {
    test("busca personas con alguna de las habilidades requeridas del perfil", async () => {
      // Preparación
      mockProyectoService.obtenerPerfilPorId.mockResolvedValue({
        habilidadesRequeridas: [objectId("h1"), objectId("h2")],
        habilidadesOpcionales: [objectId("h3")],
      });
      mockPersonaColaboradoraService.obtenerPersonasConAlgunaHabilidad.mockResolvedValue([
        { nombreFantasia: "Ana" },
      ]);

      // Ejecución
      const personas = await busquedaService.obtenerPersonasColaboradorasAcordesAPerfil(
        "p1",
        "pf1",
      );

      // Validación
      expect(mockProyectoService.obtenerPerfilPorId).toHaveBeenCalledWith("p1", "pf1");
      expect(mockPersonaColaboradoraService.obtenerPersonasConAlgunaHabilidad).toHaveBeenCalledWith(
        ["h1", "h2"],
      );
      expect(personas).toEqual([{ nombreFantasia: "Ana" }]);
    });

    test("si el perfil no existe, propaga el 404", async () => {
      mockProyectoService.obtenerPerfilPorId.mockRejectedValue(
        new AppError(ErrorCatalog.PERFIL_NO_ENCONTRADO, 404, "pf1"),
      );

      await esperarAppError(
        busquedaService.obtenerPersonasColaboradorasAcordesAPerfil("p1", "pf1"),
        ErrorCatalog.PERFIL_NO_ENCONTRADO,
        404,
      );
      expect(
        mockPersonaColaboradoraService.obtenerPersonasConAlgunaHabilidad,
      ).not.toHaveBeenCalled();
    });
  });

  describe("obtenerProyectosAcordesALaPersonaColaboradora", () => {
    test("busca proyectos que requieran alguna habilidad de la persona", async () => {
      // Preparación
      mockPersonaColaboradoraService.obtenerPersonaColaboradoraPorId.mockResolvedValue({
        habilidades: [objectId("h1")],
      });
      mockProyectoService.obtenerProyectosConAlgunaHabilidad.mockResolvedValue([{ titulo: "Web" }]);

      // Ejecución
      const proyectos = await busquedaService.obtenerProyectosAcordesALaPersonaColaboradora("pc1");

      // Validación
      expect(mockPersonaColaboradoraService.obtenerPersonaColaboradoraPorId).toHaveBeenCalledWith(
        "pc1",
      );
      expect(mockProyectoService.obtenerProyectosConAlgunaHabilidad).toHaveBeenCalledWith(["h1"]);
      expect(proyectos).toEqual([{ titulo: "Web" }]);
    });

    test("si la colaboradora no existe, propaga el 404", async () => {
      mockPersonaColaboradoraService.obtenerPersonaColaboradoraPorId.mockRejectedValue(
        new AppError(ErrorCatalog.COLABORADORA_NO_ENCONTRADA, 404),
      );

      await esperarAppError(
        busquedaService.obtenerProyectosAcordesALaPersonaColaboradora("inexistente"),
        ErrorCatalog.COLABORADORA_NO_ENCONTRADA,
        404,
      );
    });
  });
});
