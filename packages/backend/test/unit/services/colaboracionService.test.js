import { jest } from "@jest/globals";
import { ColaboracionService } from "../../../src/services/colaboracionService.js";
import { Colaboracion } from "../../../src/models/colaboracion.js";
import { AppError } from "../../../src/errors/appError.js";
import ErrorCatalog from "../../../src/errors/errorCatalog.js";
import { esperarAppError } from "../../utils/esperarAppError.js";

const ana = { _id: "pc1", nombreFantasia: "Ana", habilidades: ["h-react"] };

// Perfil sin límite de colaboraciones, salvo que el test indique una cantidad máxima
const perfil = (cambios = {}) => ({
  _id: "perfil1",
  descripcion: "Desarrollo web",
  habilidadesRequeridas: ["h-react"],
  habilidadesOpcionales: ["h-testing"],
  ...cambios,
});

const proyecto = (cambios = {}) => ({
  _id: "p1",
  titulo: "Web institucional",
  colectivo: { nombre: "Fundación Ejemplo" },
  finalizado: false,
  ...cambios,
});

describe("ColaboracionService", () => {
  let mockRepo;
  let mockPersonaColaboradoraService;
  let mockProyectoService;
  let colaboracionService;

  beforeEach(() => {
    mockRepo = {
      guardar: jest.fn(),
      obtenerTodas: jest.fn(),
      obtenerPorId: jest.fn(),
      contarActivasPorPerfil: jest.fn().mockResolvedValue(0),
      desactivar: jest.fn(),
    };
    mockPersonaColaboradoraService = {
      obtenerPersonaColaboradoraPorId: jest.fn().mockResolvedValue(ana),
    };
    mockProyectoService = {
      obtenerProyectoPorId: jest.fn().mockResolvedValue(proyecto()),
      obtenerPerfilPorId: jest.fn().mockResolvedValue(perfil()),
    };
    colaboracionService = new ColaboracionService({
      colaboracionRepository: mockRepo,
      personaColaboradoraService: mockPersonaColaboradoraService,
      proyectoService: mockProyectoService,
    });
  });

  describe("crearColaboracion", () => {
    test("guarda la colaboración de la persona en el perfil del proyecto", async () => {
      // Preparación
      mockRepo.guardar.mockResolvedValue({ id: "col1" });

      // Ejecución
      const colaboracion = await colaboracionService.crearColaboracion(
        "pc1",
        "p1",
        "perfil1",
        false,
      );

      // Validación
      expect(mockPersonaColaboradoraService.obtenerPersonaColaboradoraPorId).toHaveBeenCalledWith(
        "pc1",
      );
      expect(mockProyectoService.obtenerProyectoPorId).toHaveBeenCalledWith("p1");
      expect(mockProyectoService.obtenerPerfilPorId).toHaveBeenCalledWith("p1", "perfil1");
      expect(mockRepo.guardar).toHaveBeenCalledWith(expect.any(Colaboracion));
      expect(colaboracion).toMatchObject({
        id: "col1",
        personaColaboradora: ana,
        proyecto: proyecto(),
        perfil: perfil(),
        anonima: false,
      });
    });

    test("puede quedar registrada como anónima", async () => {
      mockRepo.guardar.mockResolvedValue({ id: "col1" });

      const colaboracion = await colaboracionService.crearColaboracion("pc1", "p1", "perfil1", true);

      expect(colaboracion.anonima).toBe(true);
    });

    test("sin cantidad máxima en el perfil no cuenta las colaboraciones ocupadas", async () => {
      mockRepo.guardar.mockResolvedValue({ id: "col1" });

      await colaboracionService.crearColaboracion("pc1", "p1", "perfil1", false);

      expect(mockRepo.contarActivasPorPerfil).not.toHaveBeenCalled();
    });

    test("si el perfil tiene lugar, la anota", async () => {
      // Preparación: el perfil admite 2 y hay 1 ocupado
      mockProyectoService.obtenerPerfilPorId.mockResolvedValue(perfil({ cantidadMaxima: 2 }));
      mockRepo.contarActivasPorPerfil.mockResolvedValue(1);
      mockRepo.guardar.mockResolvedValue({ id: "col1" });

      // Ejecución
      await colaboracionService.crearColaboracion("pc1", "p1", "perfil1", false);

      // Validación
      expect(mockRepo.contarActivasPorPerfil).toHaveBeenCalledWith("p1", "perfil1");
      expect(mockRepo.guardar).toHaveBeenCalled();
    });

    test("no se puede anotar si el cupo del perfil está completo", async () => {
      // Preparación: el perfil admite 2 y ya hay 2 ocupados
      mockProyectoService.obtenerPerfilPorId.mockResolvedValue(perfil({ cantidadMaxima: 2 }));
      mockRepo.contarActivasPorPerfil.mockResolvedValue(2);

      // Ejecución
      const resultado = colaboracionService.crearColaboracion("pc1", "p1", "perfil1", false);

      // Validación
      await esperarAppError(resultado, ErrorCatalog.COLABORACION_CUPO_COMPLETO, 409);
      expect(mockRepo.guardar).not.toHaveBeenCalled();
    });

    test("no se puede colaborar en un proyecto finalizado", async () => {
      mockProyectoService.obtenerProyectoPorId.mockResolvedValue(proyecto({ finalizado: true }));

      await esperarAppError(
        colaboracionService.crearColaboracion("pc1", "p1", "perfil1", false),
        ErrorCatalog.COLABORACION_PROYECTO_FINALIZADO,
        409,
      );
      expect(mockRepo.guardar).not.toHaveBeenCalled();
    });

    test.each([
      [
        "la persona",
        () =>
          mockPersonaColaboradoraService.obtenerPersonaColaboradoraPorId.mockRejectedValue(
            new AppError(ErrorCatalog.COLABORADORA_NO_ENCONTRADA, 404),
          ),
        ErrorCatalog.COLABORADORA_NO_ENCONTRADA,
      ],
      [
        "el proyecto",
        () =>
          mockProyectoService.obtenerProyectoPorId.mockRejectedValue(
            new AppError(ErrorCatalog.PROYECTO_NO_ENCONTRADO, 404, "p1"),
          ),
        ErrorCatalog.PROYECTO_NO_ENCONTRADO,
      ],
      [
        "el perfil",
        () =>
          mockProyectoService.obtenerPerfilPorId.mockRejectedValue(
            new AppError(ErrorCatalog.PERFIL_NO_ENCONTRADO, 404, "perfil1"),
          ),
        ErrorCatalog.PERFIL_NO_ENCONTRADO,
      ],
    ])("si no existe %s, propaga el 404", async (_, prepararFalla, errorEsperado) => {
      prepararFalla();

      await esperarAppError(
        colaboracionService.crearColaboracion("pc1", "p1", "perfil1", false),
        errorEsperado,
        404,
      );
      expect(mockRepo.guardar).not.toHaveBeenCalled();
    });
  });

  // La persona de una colaboración anónima la oculta el repositorio (proyección de Mongo),
  // por eso el servicio devuelve tal cual lo que recibe.
  describe("consultas", () => {
    test("obtenerColaboraciones devuelve lo que entrega el repositorio", async () => {
      const colaboraciones = [{ _id: "col1", personaColaboradora: null, anonima: true }];
      mockRepo.obtenerTodas.mockResolvedValue(colaboraciones);

      await expect(colaboracionService.obtenerColaboraciones()).resolves.toBe(colaboraciones);
    });

    test("obtenerColaboracionPorId devuelve la colaboración", async () => {
      const colaboracion = { _id: "col1", personaColaboradora: ana, anonima: false };
      mockRepo.obtenerPorId.mockResolvedValue(colaboracion);

      await expect(colaboracionService.obtenerColaboracionPorId("col1")).resolves.toBe(
        colaboracion,
      );
    });

    test("obtenerColaboracionPorId falla con 404 si no existe", async () => {
      mockRepo.obtenerPorId.mockResolvedValue(null);

      await esperarAppError(
        colaboracionService.obtenerColaboracionPorId("inexistente"),
        ErrorCatalog.COLABORACION_NO_ENCONTRADA,
        404,
      );
    });
  });

  describe("desactivarColaboracion", () => {
    test("da de baja una colaboración activa", async () => {
      mockRepo.obtenerPorId.mockResolvedValue({ _id: "col1", activo: true });

      await colaboracionService.desactivarColaboracion("col1");

      expect(mockRepo.desactivar).toHaveBeenCalledWith("col1");
    });

    test("falla con 404 si no existe", async () => {
      mockRepo.obtenerPorId.mockResolvedValue(null);

      await esperarAppError(
        colaboracionService.desactivarColaboracion("inexistente"),
        ErrorCatalog.COLABORACION_NO_ENCONTRADA,
        404,
      );
      expect(mockRepo.desactivar).not.toHaveBeenCalled();
    });

    test("falla con 409 si ya estaba dada de baja", async () => {
      mockRepo.obtenerPorId.mockResolvedValue({ _id: "col1", activo: false });

      await esperarAppError(
        colaboracionService.desactivarColaboracion("col1"),
        ErrorCatalog.COLABORACION_YA_DADA_DE_BAJA,
        409,
      );
      expect(mockRepo.desactivar).not.toHaveBeenCalled();
    });
  });
});
