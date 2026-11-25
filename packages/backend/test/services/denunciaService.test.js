import { usarBaseDeDatos } from "../utils/db.js";
import { esperarAppError } from "../utils/esperarAppError.js";
import {
  armarEscenario,
  crearColaboracion,
  idInexistente,
  sembrarDenuncia,
} from "../utils/escenarios.js";
import { denunciaService, colaboracionService } from "../../src/container.js";
import ErrorCatalog from "../../src/errors/errorCatalog.js";
import { EstadoDenuncia } from "../../src/models/denuncia.js";
import { ColectivoModel } from "../../src/schemas/colectivoSchema.js";

usarBaseDeDatos();

describe("DenunciaService", () => {
  describe("crearDenuncia", () => {
    test("registra la denuncia pendiente en el colectivo responsable del proyecto", async () => {
      // Preparación
      const e = await armarEscenario();
      const { colaboracionId } = await crearColaboracion(e);

      // Ejecución
      const denuncia = await denunciaService.crearDenuncia(colaboracionId, {
        descripcion: "  Trato inadecuado  ",
      });

      // Validación
      expect(denuncia).toMatchObject({
        descripcion: "Trato inadecuado",
        estado: EstadoDenuncia.PENDIENTE,
        colaboracionId,
      });
      expect(denuncia.id).toBeDefined();
      const colectivo = await ColectivoModel.findById(e.colectivoId).select("+denuncias").lean();
      expect(colectivo.denuncias).toHaveLength(1);
      expect(colectivo.denuncias[0].colaboracionId.toString()).toBe(colaboracionId);
    });

    test("una colaboración dada de baja también acredita participación", async () => {
      const e = await armarEscenario();
      const { colaboracionId } = await crearColaboracion(e);
      await colaboracionService.desactivarColaboracion(colaboracionId);

      const denuncia = await denunciaService.crearDenuncia(colaboracionId, { descripcion: "X" });

      expect(denuncia.estado).toBe(EstadoDenuncia.PENDIENTE);
    });

    test("no permite dos denuncias para la misma colaboración", async () => {
      const e = await armarEscenario();
      const { colaboracionId } = await crearColaboracion(e);
      await sembrarDenuncia(e.colectivoId, colaboracionId);

      await esperarAppError(
        denunciaService.crearDenuncia(colaboracionId, { descripcion: "Segunda" }),
        ErrorCatalog.DENUNCIA_DUPLICADA,
        409,
      );
    });

    test.each([[undefined], [""], ["   "], [42]])(
      "exige una descripción de texto no vacía (%p)",
      async (descripcion) => {
        const e = await armarEscenario();
        const { colaboracionId } = await crearColaboracion(e);

        await esperarAppError(
          denunciaService.crearDenuncia(colaboracionId, { descripcion }),
          ErrorCatalog.DENUNCIA_DESCRIPCION_REQUERIDA,
          400,
        );
      },
    );

    test("falla con 404 si la colaboración no existe", async () => {
      await esperarAppError(
        denunciaService.crearDenuncia(idInexistente(), { descripcion: "X" }),
        ErrorCatalog.COLABORACION_NO_ENCONTRADA,
        404,
      );
    });
  });

  describe("consultas administrativas", () => {
    test("obtenerDenunciasParaAdmin lista todas y filtra por estado", async () => {
      // Preparación
      const e = await armarEscenario();
      const { colaboracionId } = await crearColaboracion(e);
      await sembrarDenuncia(e.colectivoId, colaboracionId, {
        descripcion: "Uno",
        estado: "resuelta",
      });
      await sembrarDenuncia(e.colectivoId, colaboracionId, { descripcion: "Dos" });

      // Ejecución
      const todas = await denunciaService.obtenerDenunciasParaAdmin();
      const resueltas = await denunciaService.obtenerDenunciasParaAdmin({
        estado: EstadoDenuncia.RESUELTA,
      });

      // Validación
      expect(todas).toHaveLength(2);
      expect(todas[0].colectivoNombre).toBe(e.colectivo.nombre);
      expect(todas[0].colectivoId.toString()).toBe(e.colectivoId);
      expect(resueltas).toHaveLength(1);
      expect(resueltas[0].descripcion).toBe("Uno");
    });

    // BUG: el controller arma el filtro con colectivoId, pero el repositorio
    // (obtenerTodasLasDenuncias) solo aplica el filtro por estado e ignora el colectivo.
    test.failing("obtenerDenunciasParaAdmin filtra por colectivo", async () => {
      const e1 = await armarEscenario();
      const e2 = await armarEscenario();
      const { colaboracionId: c1 } = await crearColaboracion(e1);
      const { colaboracionId: c2 } = await crearColaboracion(e2);
      await sembrarDenuncia(e1.colectivoId, c1, { descripcion: "Uno" });
      await sembrarDenuncia(e2.colectivoId, c2, { descripcion: "Dos" });

      const delPrimero = await denunciaService.obtenerDenunciasParaAdmin({
        colectivoId: e1.colectivoId,
      });

      expect(delPrimero).toHaveLength(1);
      expect(delPrimero[0].descripcion).toBe("Uno");
    });

    test("obtenerDenunciaPorIdParaAdmin devuelve la denuncia con la colaboración", async () => {
      const e = await armarEscenario();
      const { colaboracionId } = await crearColaboracion(e);
      const denunciaId = await sembrarDenuncia(e.colectivoId, colaboracionId, { descripcion: "X" });

      const denuncia = await denunciaService.obtenerDenunciaPorIdParaAdmin(denunciaId);

      expect(denuncia.descripcion).toBe("X");
      expect(denuncia.estado).toBe(EstadoDenuncia.PENDIENTE);
      expect(denuncia.colectivoId.toString()).toBe(e.colectivoId);
      expect(denuncia.colectivoNombre).toBe(e.colectivo.nombre);
      expect(denuncia.colaboracion._id.toString()).toBe(colaboracionId);
    });

    test("obtenerDenunciaPorIdParaAdmin falla con 404 si no existe", async () => {
      await esperarAppError(
        denunciaService.obtenerDenunciaPorIdParaAdmin(idInexistente()),
        ErrorCatalog.DENUNCIA_NO_ENCONTRADA,
        404,
      );
    });
  });

  describe("actualizarEstadoDenuncia", () => {
    test("cambia el estado (normalizando mayúsculas)", async () => {
      const e = await armarEscenario();
      const { colaboracionId } = await crearColaboracion(e);
      const denunciaId = await sembrarDenuncia(e.colectivoId, colaboracionId);

      const actualizada = await denunciaService.actualizarEstadoDenuncia(denunciaId, "EN_REVISION");

      expect(actualizada.estado).toBe(EstadoDenuncia.EN_REVISION);
      const enBase = await denunciaService.obtenerDenunciaPorIdParaAdmin(denunciaId);
      expect(enBase.estado).toBe(EstadoDenuncia.EN_REVISION);
    });

    test("exige un estado", async () => {
      await esperarAppError(
        denunciaService.actualizarEstadoDenuncia(idInexistente(), undefined),
        ErrorCatalog.DENUNCIA_ESTADO_REQUERIDO,
        400,
      );
    });

    test("no permite volver a pendiente ni estados desconocidos", async () => {
      await esperarAppError(
        denunciaService.actualizarEstadoDenuncia(idInexistente(), EstadoDenuncia.PENDIENTE),
        ErrorCatalog.DENUNCIA_ESTADO_INVALIDO,
        400,
      );
      await esperarAppError(
        denunciaService.actualizarEstadoDenuncia(idInexistente(), "archivada"),
        ErrorCatalog.DENUNCIA_ESTADO_INVALIDO,
        400,
      );
    });

    test("falla con 404 si la denuncia no existe", async () => {
      await esperarAppError(
        denunciaService.actualizarEstadoDenuncia(idInexistente(), EstadoDenuncia.RESUELTA),
        ErrorCatalog.DENUNCIA_NO_ENCONTRADA,
        404,
      );
    });
  });
});
