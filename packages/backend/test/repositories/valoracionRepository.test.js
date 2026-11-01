import { describe, test, expect, jest, beforeEach } from "@jest/globals";
import { ValoracionRepository } from "../../src/repositories/valoracionRepository.js";
import { ValoracionModel } from "../../src/schemas/valoracionSchema.js";
import ErrorCatalog from "../../src/errors/errorCatalog.js";
import { TipoEvaluador } from "../../src/models/valoracion.js";

describe("ValoracionRepository", () => {
  let repository;

  beforeEach(() => {
    repository = new ValoracionRepository();
  });

  describe("guardar", () => {
    test("instancia el modelo y guarda exitosamente", async () => {
      const mockSave = jest.fn().mockResolvedValue({
        _id: "val123",
        colaboracion: "col1",
        evaluador: TipoEvaluador.COLECTIVO,
        puntaje: 5,
        comentario: "Excelente",
      });

      function MockModel(data) {
        Object.assign(this, data);
        this.save = mockSave;
      }
      repository.model = MockModel;

      const datos = {
        colaboracion: "col1",
        evaluador: TipoEvaluador.COLECTIVO,
        puntaje: 5,
        comentario: "Excelente",
      };

      const resultado = await repository.guardar(datos);

      expect(mockSave).toHaveBeenCalledTimes(1);
      expect(resultado).toMatchObject(datos);
    });

    test("captura error E11000 de MongoDB y lanza AppError VALORACION_EXISTENTE (400)", async () => {
      const mongoError = new Error("E11000 duplicate key error collection");
      mongoError.code = 11000;

      function MockModel() {
        this.save = jest.fn().mockRejectedValue(mongoError);
      }
      repository.model = MockModel;

      const datos = {
        colaboracion: "col1",
        evaluador: TipoEvaluador.COLECTIVO,
        puntaje: 5,
      };

      await expect(repository.guardar(datos)).rejects.toMatchObject({
        code: ErrorCatalog.VALORACION_EXISTENTE.code,
        statusCode: 400,
      });
    });

    test("re-lanza cualquier otro error no relacionado con E11000", async () => {
      const otroError = new Error("Database timeout");
      otroError.code = "ETIMEDOUT";

      function MockModel() {
        this.save = jest.fn().mockRejectedValue(otroError);
      }
      repository.model = MockModel;

      await expect(repository.guardar({ colaboracion: "c1" })).rejects.toThrow("Database timeout");
    });
  });

  describe("obtenerPorColaboracionIds", () => {
    test("construye la query con $in y la proyección pública sin autor ni destinatario", async () => {
      const mockLean = jest.fn().mockResolvedValue([
        { _id: "v1", colaboracion: "c1", evaluador: "colectivo", puntaje: 5 },
      ]);
      const mockFind = jest.fn().mockReturnValue({ lean: mockLean });

      repository.model = { find: mockFind };

      const ids = ["col1", "col2"];
      const resultado = await repository.obtenerPorColaboracionIds(ids, {
        evaluador: TipoEvaluador.COLECTIVO,
      });

      expect(mockFind).toHaveBeenCalledWith(
        { colaboracion: { $in: ids }, evaluador: TipoEvaluador.COLECTIVO },
        {
          _id: 1,
          colaboracion: 1,
          evaluador: 1,
          puntaje: 1,
          comentario: 1,
          createdAt: 1,
        },
      );
      expect(mockLean).toHaveBeenCalled();
      expect(resultado).toHaveLength(1);
    });

    test("sin evaluador omite el filtro de evaluador en la query", async () => {
      const mockLean = jest.fn().mockResolvedValue([]);
      const mockFind = jest.fn().mockReturnValue({ lean: mockLean });

      repository.model = { find: mockFind };

      await repository.obtenerPorColaboracionIds(["col1"]);

      expect(mockFind).toHaveBeenCalledWith(
        { colaboracion: { $in: ["col1"] } },
        expect.any(Object),
      );
    });
  });

  describe("obtenerPorPersonaColaboradoraId", () => {
    test("para 'recibidas' consulta por destinatario con proyección pública", async () => {
      const mockLean = jest.fn().mockResolvedValue([]);
      const mockFind = jest.fn().mockReturnValue({ lean: mockLean });
      repository.model = { find: mockFind };

      await repository.obtenerPorPersonaColaboradoraId("persona123", { direccion: "recibidas" });

      expect(mockFind).toHaveBeenCalledWith(
        { destinatario: "persona123" },
        {
          _id: 1,
          colaboracion: 1,
          evaluador: 1,
          puntaje: 1,
          comentario: 1,
          createdAt: 1,
        },
      );
    });

    test("para 'emitidas' consulta por autor con proyección pública", async () => {
      const mockLean = jest.fn().mockResolvedValue([]);
      const mockFind = jest.fn().mockReturnValue({ lean: mockLean });
      repository.model = { find: mockFind };

      await repository.obtenerPorPersonaColaboradoraId("persona123", { direccion: "emitidas" });

      expect(mockFind).toHaveBeenCalledWith(
        { autor: "persona123" },
        expect.objectContaining({ _id: 1, puntaje: 1 }),
      );
    });

    test("para 'todas' consulta por $or (destinatario o autor)", async () => {
      const mockLean = jest.fn().mockResolvedValue([]);
      const mockFind = jest.fn().mockReturnValue({ lean: mockLean });
      repository.model = { find: mockFind };

      await repository.obtenerPorPersonaColaboradoraId("persona123", { direccion: "todas" });

      expect(mockFind).toHaveBeenCalledWith(
        { $or: [{ destinatario: "persona123" }, { autor: "persona123" }] },
        expect.any(Object),
      );
    });
  });

  describe("obtenerPorColectivoId", () => {
    test("para 'recibidas' consulta por destinatario con proyección pública", async () => {
      const mockLean = jest.fn().mockResolvedValue([]);
      const mockFind = jest.fn().mockReturnValue({ lean: mockLean });
      repository.model = { find: mockFind };

      await repository.obtenerPorColectivoId("colectivo123", { direccion: "recibidas" });

      expect(mockFind).toHaveBeenCalledWith(
        { destinatario: "colectivo123" },
        {
          _id: 1,
          colaboracion: 1,
          evaluador: 1,
          puntaje: 1,
          comentario: 1,
          createdAt: 1,
        },
      );
    });

    test("para 'emitidas' consulta por autor", async () => {
      const mockLean = jest.fn().mockResolvedValue([]);
      const mockFind = jest.fn().mockReturnValue({ lean: mockLean });
      repository.model = { find: mockFind };

      await repository.obtenerPorColectivoId("colectivo123", { direccion: "emitidas" });

      expect(mockFind).toHaveBeenCalledWith(
        { autor: "colectivo123" },
        expect.any(Object),
      );
    });
  });

  describe("Schema y restricciones de persistencia", () => {
    test("el schema de Mongoose define el índice compuesto único { colaboracion: 1, evaluador: 1 }", () => {
      const indices = ValoracionModel.schema.indexes();
      const indiceCompuesto = indices.find(
        ([campos]) => campos.colaboracion === 1 && campos.evaluador === 1,
      );

      expect(indiceCompuesto).toBeDefined();
      expect(indiceCompuesto[1]).toMatchObject({ unique: true });
    });

    test("el schema no expone por defecto __v, createdAt ni updatedAt", () => {
      const paths = ValoracionModel.schema.paths;
      expect(paths.createdAt.options.select).toBe(false);
      expect(paths.updatedAt.options.select).toBe(false);
      expect(paths.__v.options.select).toBe(false);
    });
  });
});
