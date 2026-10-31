import { jest } from "@jest/globals";
import { ColectivoService } from "../../../src/services/colectivoService.js";
import { Colectivo } from "../../../src/models/colectivo.js";
import ErrorCatalog from "../../../src/errors/errorCatalog.js";
import { esperarAppError } from "../../utils/esperarAppError.js";

describe("ColectivoService", () => {
  let mockRepo;
  let colectivoService;

  beforeEach(() => {
    mockRepo = {
      guardar: jest.fn(),
      obtenerTodos: jest.fn(),
      obtenerPorId: jest.fn(),
      obtenerPorNombre: jest.fn(),
      agregarProyecto: jest.fn(),
    };
    colectivoService = new ColectivoService({ repository: mockRepo });
  });

  describe("crearColectivo", () => {
    test("guarda el colectivo sin proyectos y devuelve el id asignado", async () => {
      // Preparación
      mockRepo.obtenerPorNombre.mockResolvedValue(null);
      mockRepo.guardar.mockResolvedValue({ id: "c1" });

      // Ejecución
      const colectivo = await colectivoService.crearColectivo(
        "Fundación Ejemplo",
        "Una fundación",
        "caba",
        "fundacion",
      );

      // Validación
      expect(mockRepo.obtenerPorNombre).toHaveBeenCalledWith("Fundación Ejemplo");
      expect(mockRepo.guardar).toHaveBeenCalledWith(expect.any(Colectivo));
      expect(colectivo).toMatchObject({
        id: "c1",
        nombre: "Fundación Ejemplo",
        ubicacion: "caba",
        tipoDeColectivo: "fundacion",
        proyectos: [],
      });
    });

    test("no permite dos colectivos con el mismo nombre", async () => {
      // Preparación
      mockRepo.obtenerPorNombre.mockResolvedValue({ _id: "c1", nombre: "Fundación Ejemplo" });

      // Ejecución
      const resultado = colectivoService.crearColectivo("Fundación Ejemplo", "d", "caba", "ong");

      // Validación
      await esperarAppError(resultado, ErrorCatalog.COLECTIVO_YA_EXISTE, 409);
      expect(mockRepo.guardar).not.toHaveBeenCalled();
    });
  });

  test("obtenerColectivos devuelve lo que trae el repositorio", async () => {
    mockRepo.obtenerTodos.mockResolvedValue([{ nombre: "A" }, { nombre: "B" }]);

    expect(await colectivoService.obtenerColectivos()).toHaveLength(2);
  });

  describe("obtenerColectivoPorId", () => {
    test("devuelve el colectivo", async () => {
      mockRepo.obtenerPorId.mockResolvedValue({ _id: "c1", nombre: "A" });

      expect(await colectivoService.obtenerColectivoPorId("c1")).toEqual({
        _id: "c1",
        nombre: "A",
      });
      expect(mockRepo.obtenerPorId).toHaveBeenCalledWith("c1");
    });

    test("falla con 404 si no existe", async () => {
      mockRepo.obtenerPorId.mockResolvedValue(null);

      await esperarAppError(
        colectivoService.obtenerColectivoPorId("inexistente"),
        ErrorCatalog.COLECTIVO_NO_ENCONTRADO,
        404,
      );
    });
  });

  describe("obtenerColectivoPorNombre", () => {
    test("devuelve el colectivo", async () => {
      mockRepo.obtenerPorNombre.mockResolvedValue({ _id: "c1", nombre: "A" });

      expect((await colectivoService.obtenerColectivoPorNombre("A"))._id).toBe("c1");
    });

    test("falla con 400 si no existe (el nombre viene en el body, no en la URL)", async () => {
      mockRepo.obtenerPorNombre.mockResolvedValue(null);

      await esperarAppError(
        colectivoService.obtenerColectivoPorNombre("Nadie"),
        ErrorCatalog.COLECTIVO_NO_ENCONTRADO_POR_NOMBRE,
        400,
      );
    });
  });

  test("agregarProyecto le pide al repositorio que vincule el proyecto", async () => {
    // Preparación
    mockRepo.obtenerPorId.mockResolvedValue({ _id: "c1", proyectos: [] });

    // Ejecución
    await colectivoService.agregarProyecto("c1", "p1");

    // Validación
    expect(mockRepo.agregarProyecto).toHaveBeenCalledWith("c1", "p1");
  });
});
