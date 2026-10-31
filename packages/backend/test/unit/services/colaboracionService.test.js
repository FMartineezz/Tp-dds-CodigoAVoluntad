import { jest } from "@jest/globals";
import { ColaboracionService } from "../../../src/services/colaboracionService.js";
import { Colaboracion } from "../../../src/models/colaboracion.js";
import { AppError } from "../../../src/errors/appError.js";
import ErrorCatalog from "../../../src/errors/errorCatalog.js";
import { esperarAppError } from "../../utils/esperarAppError.js";

const ana = { _id: "pc1", nombreFantasia: "Ana", habilidades: ["h-react"] };

// Proyecto con un perfil que requiere React y acepta Testing como opcional
const proyecto = (cambios = {}) => ({
  _id: "p1",
  titulo: "Web institucional",
  colectivo: { nombre: "Fundación Ejemplo" },
  finalizado: false,
  perfiles: [{ habilidadesRequeridas: ["h-react"], habilidadesOpcionales: ["h-testing"] }],
  ...cambios,
});

describe("ColaboracionService", () => {
  let mockRepo;
  let mockPersonaColaboradoraService;
  let mockProyectoService;
  let colaboracionService;

  beforeEach(() => {
    mockRepo = { guardar: jest.fn(), obtenerTodas: jest.fn(), obtenerPorId: jest.fn() };
    mockPersonaColaboradoraService = {
      obtenerPersonaColaboradoraPorId: jest.fn().mockResolvedValue(ana),
      // Igual que el real: devuelve la persona sin sus contactos
      ocultarContactos: jest.fn((persona) => {
        const resto = { ...persona };
        delete resto.contactos;
        return resto;
      }),
    };
    mockProyectoService = { obtenerProyectoPorId: jest.fn().mockResolvedValue(proyecto()) };
    colaboracionService = new ColaboracionService({
      colaboracionRepository: mockRepo,
      personaColaboradoraService: mockPersonaColaboradoraService,
      proyectoService: mockProyectoService,
    });
  });

  describe("crearColaboracion", () => {
    test("anota a la persona si tiene al menos una habilidad requerida", async () => {
      // Preparación
      mockRepo.guardar.mockResolvedValue({ id: "col1" });

      // Ejecución
      const colaboracion = await colaboracionService.crearColaboracion("pc1", "p1", false);

      // Validación
      expect(mockPersonaColaboradoraService.obtenerPersonaColaboradoraPorId).toHaveBeenCalledWith(
        "pc1",
      );
      expect(mockProyectoService.obtenerProyectoPorId).toHaveBeenCalledWith("p1");
      expect(mockRepo.guardar).toHaveBeenCalledWith(expect.any(Colaboracion));
      expect(colaboracion).toMatchObject({
        id: "col1",
        personaColaboradora: ana,
        proyecto: proyecto(),
        anonima: false,
      });
    });

    test("compara las habilidades por id aunque vengan como ObjectId", async () => {
      // Preparación: Mongo devuelve ObjectIds, que se comparan por su toString()
      const objectId = (id) => ({ toString: () => id });
      mockPersonaColaboradoraService.obtenerPersonaColaboradoraPorId.mockResolvedValue({
        ...ana,
        habilidades: [objectId("h-react")],
      });
      mockProyectoService.obtenerProyectoPorId.mockResolvedValue(
        proyecto({ perfiles: [{ habilidadesRequeridas: [objectId("h-react")] }] }),
      );
      mockRepo.guardar.mockResolvedValue({ id: "col1" });

      // Ejecución y validación
      await expect(colaboracionService.crearColaboracion("pc1", "p1")).resolves.toMatchObject({
        id: "col1",
      });
    });

    test("tener solo habilidades opcionales no alcanza", async () => {
      // Preparación
      mockPersonaColaboradoraService.obtenerPersonaColaboradoraPorId.mockResolvedValue({
        ...ana,
        habilidades: ["h-testing"],
      });

      // Ejecución
      const resultado = colaboracionService.crearColaboracion("pc1", "p1");

      // Validación
      await esperarAppError(resultado, ErrorCatalog.COLABORACION_HABILIDAD_REQUERIDA, 400);
      await expect(resultado).rejects.toThrow(
        "La colaboradora: Ana ,debe tener al menos una habilidad requerida por el proyecto: Web institucional del colectivo: Fundación Ejemplo",
      );
      expect(mockRepo.guardar).not.toHaveBeenCalled();
    });

    test("no se puede colaborar en un proyecto finalizado", async () => {
      mockProyectoService.obtenerProyectoPorId.mockResolvedValue(proyecto({ finalizado: true }));

      await esperarAppError(
        colaboracionService.crearColaboracion("pc1", "p1"),
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
    ])("si no existe %s, propaga el 404", async (_, prepararFalla, errorEsperado) => {
      prepararFalla();

      await esperarAppError(colaboracionService.crearColaboracion("pc1", "p1"), errorEsperado, 404);
      expect(mockRepo.guardar).not.toHaveBeenCalled();
    });
  });

  describe("contribuciones anónimas", () => {
    const colaboracionGuardada = (anonima) => ({
      _id: "col1",
      anonima,
      proyecto: proyecto(),
      personaColaboradora: { ...ana, contactos: [{ tipo: "email", valor: "ana@mail.com" }] },
    });

    test("una colaboración anónima figura, pero sin la persona", async () => {
      mockRepo.obtenerPorId.mockResolvedValue(colaboracionGuardada(true));

      const colaboracion = await colaboracionService.obtenerColaboracionPorId("col1");

      expect(colaboracion.personaColaboradora).toBeNull();
      expect(colaboracion.proyecto).toEqual(proyecto());
    });

    test("una colaboración pública muestra a la persona, sin sus contactos", async () => {
      mockRepo.obtenerPorId.mockResolvedValue(colaboracionGuardada(false));

      const colaboracion = await colaboracionService.obtenerColaboracionPorId("col1");

      expect(mockPersonaColaboradoraService.ocultarContactos).toHaveBeenCalled();
      expect(colaboracion.personaColaboradora).toEqual(ana);
    });

    test("obtenerColaboraciones aplica la misma regla a cada una", async () => {
      mockRepo.obtenerTodas.mockResolvedValue([
        colaboracionGuardada(true),
        colaboracionGuardada(false),
      ]);

      const [anonima, publica] = await colaboracionService.obtenerColaboraciones();

      expect(anonima.personaColaboradora).toBeNull();
      expect(publica.personaColaboradora).toEqual(ana);
    });
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
