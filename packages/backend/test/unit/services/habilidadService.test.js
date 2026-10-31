import { jest } from "@jest/globals";
import { HabilidadService } from "../../../src/services/habilidadService.js";
import { Habilidad } from "../../../src/models/habilidad.js";
import ErrorCatalog from "../../../src/errors/errorCatalog.js";
import { esperarAppError } from "../../utils/esperarAppError.js";

describe("HabilidadService", () => {
  let mockRepo;
  let habilidadService;

  beforeEach(() => {
    // El repositorio real habla con Mongo: lo reemplazamos por un MOC con los mismos métodos
    mockRepo = {
      guardar: jest.fn(),
      obtenerTodas: jest.fn(),
      obtenerPorId: jest.fn(),
      obtenerPorTitulo: jest.fn(),
      obtenerPorCodigo: jest.fn(),
      obtenerPorCodigos: jest.fn(),
    };
    habilidadService = new HabilidadService({ repository: mockRepo });
  });

  describe("crearHabilidad", () => {
    test("guarda la habilidad con su código normalizado y devuelve el id asignado", async () => {
      // Preparación
      mockRepo.obtenerPorTitulo.mockResolvedValue(null);
      mockRepo.guardar.mockResolvedValue({ id: "h1" });

      // Ejecución
      const habilidad = await habilidadService.crearHabilidad(
        "Desarrollo Web React",
        "Front con React",
      );

      // Validación
      expect(mockRepo.obtenerPorTitulo).toHaveBeenCalledWith("Desarrollo Web React");
      expect(mockRepo.guardar).toHaveBeenCalledWith(expect.any(Habilidad));
      expect(habilidad).toEqual({
        id: "h1",
        titulo: "Desarrollo Web React",
        codigo: "desarrollo_web_react",
        descripcion: "Front con React",
      });
    });

    test("no permite dos habilidades con el mismo título", async () => {
      // Preparación
      mockRepo.obtenerPorTitulo.mockResolvedValue({ _id: "h1", titulo: "React" });

      // Ejecución
      const resultado = habilidadService.crearHabilidad("React", "otra descripción");

      // Validación
      await esperarAppError(resultado, ErrorCatalog.HABILIDAD_YA_EXISTE, 409);
      await expect(resultado).rejects.toThrow("su id es: h1");
      expect(mockRepo.guardar).not.toHaveBeenCalled();
    });
  });

  test("obtenerHabilidades devuelve lo que trae el repositorio", async () => {
    // Preparación
    const habilidades = [{ titulo: "React" }, { titulo: "Node" }];
    mockRepo.obtenerTodas.mockResolvedValue(habilidades);

    // Ejecución
    const resultado = await habilidadService.obtenerHabilidades();

    // Validación
    expect(resultado).toEqual(habilidades);
  });

  describe("obtenerHabilidadPorId", () => {
    test("devuelve la habilidad", async () => {
      mockRepo.obtenerPorId.mockResolvedValue({ _id: "h1", titulo: "React" });

      const habilidad = await habilidadService.obtenerHabilidadPorId("h1");

      expect(mockRepo.obtenerPorId).toHaveBeenCalledWith("h1");
      expect(habilidad.titulo).toBe("React");
    });

    test("falla con 404 si no existe", async () => {
      mockRepo.obtenerPorId.mockResolvedValue(null);

      await esperarAppError(
        habilidadService.obtenerHabilidadPorId("inexistente"),
        ErrorCatalog.HABILIDAD_NO_ENCONTRADA_POR_ID,
        404,
      );
    });
  });

  describe("obtenerHabilidadPorCodigo", () => {
    test("busca la habilidad por su código", async () => {
      mockRepo.obtenerPorCodigo.mockResolvedValue({ _id: "h1", codigo: "react" });

      const habilidad = await habilidadService.obtenerHabilidadPorCodigo("react");

      expect(mockRepo.obtenerPorCodigo).toHaveBeenCalledWith("react");
      expect(habilidad._id).toBe("h1");
    });

    test("falla con 400 si el código no existe", async () => {
      mockRepo.obtenerPorCodigo.mockResolvedValue(null);

      const resultado = habilidadService.obtenerHabilidadPorCodigo("cobol");

      await esperarAppError(resultado, ErrorCatalog.HABILIDAD_INEXISTENTE_GENERICO, 400);
      await expect(resultado).rejects.toThrow("La habilidad de codigo cobol no existe");
    });
  });

  test("obtenerHabilidadesPorCodigos le pasa los códigos al repositorio", async () => {
    mockRepo.obtenerPorCodigos.mockResolvedValue([{ codigo: "react" }]);

    const habilidades = await habilidadService.obtenerHabilidadesPorCodigos(["react", "cobol"]);

    expect(mockRepo.obtenerPorCodigos).toHaveBeenCalledWith(["react", "cobol"]);
    expect(habilidades).toEqual([{ codigo: "react" }]);
  });
});
