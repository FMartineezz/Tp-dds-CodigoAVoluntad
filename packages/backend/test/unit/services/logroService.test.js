import { jest } from "@jest/globals";
import { LogroService } from "../../../src/services/logroService.js";
import { Logro } from "../../../src/models/logro.js";
import { AppError } from "../../../src/errors/appError.js";
import ErrorCatalog from "../../../src/errors/errorCatalog.js";
import { esperarAppError } from "../../utils/esperarAppError.js";

// Proyecto con logros de los porcentajes indicados (ids l1, l2, ...)
const proyectoConLogros = (porcentajes, finalizado = false) => ({
  _id: "p1",
  finalizado,
  logros: porcentajes.map((porcentaje, i) => ({ _id: `l${i + 1}`, porcentaje })),
});

const datosLogro = (porcentaje) => ({
  descripcion: "MVP",
  porcentaje,
  urlCodigoFuente: "https://github.com/x",
});

describe("LogroService", () => {
  let mockRepo;
  let mockProyectoService;
  let logroService;

  beforeEach(() => {
    mockRepo = {
      guardarLogro: jest.fn(),
      obtenerLogros: jest.fn(),
      obtenerLogroPorId: jest.fn(),
      actualizarLogro: jest.fn(),
      eliminarLogro: jest.fn(),
    };
    mockProyectoService = { obtenerProyectoPorId: jest.fn() };
    logroService = new LogroService({
      proyectoService: mockProyectoService,
      proyectoRepository: mockRepo,
    });
  });

  describe("crearLogro", () => {
    test("guarda el logro en el proyecto", async () => {
      // Preparación
      mockProyectoService.obtenerProyectoPorId.mockResolvedValue(proyectoConLogros([]));
      mockRepo.guardarLogro.mockResolvedValue({ _id: "l1", ...datosLogro(40) });

      // Ejecución
      const logro = await logroService.crearLogro("p1", datosLogro(40));

      // Validación
      expect(mockProyectoService.obtenerProyectoPorId).toHaveBeenCalledWith("p1");
      expect(mockRepo.guardarLogro).toHaveBeenCalledWith("p1", expect.any(Logro));
      expect(mockRepo.guardarLogro.mock.calls[0][1]).toMatchObject(datosLogro(40));
      expect(logro._id).toBe("l1");
    });

    test("los porcentajes pueden sumar exactamente 100", async () => {
      mockProyectoService.obtenerProyectoPorId.mockResolvedValue(proyectoConLogros([40, 30]));

      await logroService.crearLogro("p1", datosLogro(30));

      expect(mockRepo.guardarLogro).toHaveBeenCalled();
    });

    test("los porcentajes no pueden superar 100 en total", async () => {
      mockProyectoService.obtenerProyectoPorId.mockResolvedValue(proyectoConLogros([40, 30]));

      await esperarAppError(
        logroService.crearLogro("p1", datosLogro(31)),
        ErrorCatalog.PROYECTO_PORCENTAJE_MAXIMO,
        400,
      );
      expect(mockRepo.guardarLogro).not.toHaveBeenCalled();
    });

    test("no se pueden cargar logros en un proyecto finalizado", async () => {
      mockProyectoService.obtenerProyectoPorId.mockResolvedValue(proyectoConLogros([], true));

      await esperarAppError(
        logroService.crearLogro("p1", datosLogro(10)),
        ErrorCatalog.PROYECTO_FINALIZADO,
        400,
      );
      expect(mockRepo.guardarLogro).not.toHaveBeenCalled();
    });

    test("si el proyecto no existe, propaga el 404", async () => {
      mockProyectoService.obtenerProyectoPorId.mockRejectedValue(
        new AppError(ErrorCatalog.PROYECTO_NO_ENCONTRADO, 404, "inexistente"),
      );

      await esperarAppError(
        logroService.crearLogro("inexistente", datosLogro(10)),
        ErrorCatalog.PROYECTO_NO_ENCONTRADO,
        404,
      );
    });
  });

  test("obtenerLogros verifica que exista el proyecto y devuelve sus logros", async () => {
    mockProyectoService.obtenerProyectoPorId.mockResolvedValue(proyectoConLogros([50]));
    mockRepo.obtenerLogros.mockResolvedValue([{ _id: "l1" }]);

    expect(await logroService.obtenerLogros("p1")).toEqual([{ _id: "l1" }]);
    expect(mockProyectoService.obtenerProyectoPorId).toHaveBeenCalledWith("p1");
    expect(mockRepo.obtenerLogros).toHaveBeenCalledWith("p1");
  });

  describe("obtenerLogroPorId", () => {
    test("devuelve el logro", async () => {
      mockProyectoService.obtenerProyectoPorId.mockResolvedValue(proyectoConLogros([50]));
      mockRepo.obtenerLogroPorId.mockResolvedValue({ _id: "l1", porcentaje: 50 });

      expect(await logroService.obtenerLogroPorId("p1", "l1")).toEqual({
        _id: "l1",
        porcentaje: 50,
      });
      expect(mockRepo.obtenerLogroPorId).toHaveBeenCalledWith("p1", "l1");
    });

    test("falla con 404 si el logro no existe", async () => {
      mockProyectoService.obtenerProyectoPorId.mockResolvedValue(proyectoConLogros([]));
      mockRepo.obtenerLogroPorId.mockResolvedValue(null);

      await esperarAppError(
        logroService.obtenerLogroPorId("p1", "inexistente"),
        ErrorCatalog.PROYECTO_LOGRO_NO_ENCONTRADO,
        404,
      );
    });
  });

  describe("actualizarLogro", () => {
    beforeEach(() => {
      mockProyectoService.obtenerProyectoPorId.mockResolvedValue(proyectoConLogros([60, 40]));
      mockRepo.obtenerLogroPorId.mockResolvedValue({ _id: "l1", porcentaje: 60 });
    });

    test("permite cambios parciales", async () => {
      // Preparación
      mockRepo.actualizarLogro.mockResolvedValue({ _id: "l1", descripcion: "Beta" });

      // Ejecución
      const logro = await logroService.actualizarLogro("p1", "l1", { descripcion: "Beta" });

      // Validación
      expect(mockRepo.actualizarLogro).toHaveBeenCalledWith("p1", "l1", { descripcion: "Beta" });
      expect(logro.descripcion).toBe("Beta");
    });

    test("el porcentaje del logro editado no se cuenta dos veces", async () => {
      // Total actual 60 + 40 = 100. Reescribir l1 con 60 deja 100; si se contara dos veces daría 160
      await logroService.actualizarLogro("p1", "l1", { porcentaje: 60 });

      expect(mockRepo.actualizarLogro).toHaveBeenCalled();
    });

    test("no puede dejar el total por encima de 100", async () => {
      await esperarAppError(
        logroService.actualizarLogro("p1", "l1", { porcentaje: 61 }),
        ErrorCatalog.PROYECTO_PORCENTAJE_MAXIMO,
        400,
      );
      expect(mockRepo.actualizarLogro).not.toHaveBeenCalled();
    });

    test("no se pueden editar logros de un proyecto finalizado", async () => {
      mockProyectoService.obtenerProyectoPorId.mockResolvedValue(proyectoConLogros([60], true));

      await esperarAppError(
        logroService.actualizarLogro("p1", "l1", { descripcion: "x" }),
        ErrorCatalog.PROYECTO_FINALIZADO,
        400,
      );
      expect(mockRepo.actualizarLogro).not.toHaveBeenCalled();
    });

    test("falla con 404 si el logro no existe", async () => {
      mockRepo.obtenerLogroPorId.mockResolvedValue(null);

      await esperarAppError(
        logroService.actualizarLogro("p1", "inexistente", { porcentaje: 10 }),
        ErrorCatalog.PROYECTO_LOGRO_NO_ENCONTRADO,
        404,
      );
    });
  });

  describe("eliminarLogro", () => {
    test("le pide al repositorio que lo quite", async () => {
      mockProyectoService.obtenerProyectoPorId.mockResolvedValue(proyectoConLogros([60]));
      mockRepo.obtenerLogroPorId.mockResolvedValue({ _id: "l1" });
      mockRepo.eliminarLogro.mockResolvedValue({ _id: "l1" });

      expect(await logroService.eliminarLogro("p1", "l1")).toEqual({ _id: "l1" });
      expect(mockRepo.eliminarLogro).toHaveBeenCalledWith("p1", "l1");
    });

    test("falla con 404 si el logro no existe", async () => {
      mockProyectoService.obtenerProyectoPorId.mockResolvedValue(proyectoConLogros([]));
      mockRepo.obtenerLogroPorId.mockResolvedValue(null);

      await esperarAppError(
        logroService.eliminarLogro("p1", "inexistente"),
        ErrorCatalog.PROYECTO_LOGRO_NO_ENCONTRADO,
        404,
      );
      expect(mockRepo.eliminarLogro).not.toHaveBeenCalled();
    });

    test("no se pueden eliminar logros de un proyecto finalizado", async () => {
      mockProyectoService.obtenerProyectoPorId.mockResolvedValue(proyectoConLogros([60], true));

      await esperarAppError(
        logroService.eliminarLogro("p1", "l1"),
        ErrorCatalog.PROYECTO_FINALIZADO,
        400,
      );
      expect(mockRepo.eliminarLogro).not.toHaveBeenCalled();
    });
  });
});
