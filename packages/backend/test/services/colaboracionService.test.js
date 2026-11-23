import { usarBaseDeDatos } from "../utils/db.js";
import { esperarAppError } from "../utils/esperarAppError.js";
import {
  armarEscenario,
  crearColaboracion,
  crearColaboradora,
  idInexistente,
} from "../utils/escenarios.js";
import { colaboracionService, postulacionService, proyectoService } from "../../src/container.js";
import ErrorCatalog from "../../src/errors/errorCatalog.js";
import { EstadoPostulacion } from "../../src/models/postulacion.js";
import { ColaboracionModel } from "../../src/schemas/colaboracionSchema.js";

usarBaseDeDatos();

describe("ColaboracionService", () => {
  describe("crearColaboracion", () => {
    test("crea una colaboración activa para la persona, el proyecto y el perfil", async () => {
      // Preparación
      const e = await armarEscenario();

      // Ejecución
      const colaboracion = await colaboracionService.crearColaboracion(
        e.personaId,
        e.proyectoId,
        e.perfilId,
        false,
      );

      // Validación
      expect(colaboracion.id).toBeDefined();
      const guardada = await ColaboracionModel.findById(colaboracion.id).lean();
      expect(guardada).toMatchObject({ activo: true, anonima: false });
      expect(guardada.fechaBaja).toBeUndefined();
    });

    test("no permite colaborar en un proyecto finalizado", async () => {
      const e = await armarEscenario();
      await proyectoService.finalizarProyecto(e.proyectoId);

      await esperarAppError(
        colaboracionService.crearColaboracion(e.personaId, e.proyectoId, e.perfilId, false),
        ErrorCatalog.COLABORACION_PROYECTO_FINALIZADO,
        409,
      );
    });

    test("respeta la cantidad máxima de colaboraciones activas del perfil", async () => {
      const e = await armarEscenario({ cantidadMaxima: 1 });
      const otra = await crearColaboradora({ habilidades: [e.habilidad.codigo] });
      await colaboracionService.crearColaboracion(e.personaId, e.proyectoId, e.perfilId, false);

      await esperarAppError(
        colaboracionService.crearColaboracion(otra.id, e.proyectoId, e.perfilId, false),
        ErrorCatalog.COLABORACION_CUPO_COMPLETO,
        409,
      );
    });

    test("sin cantidadMaxima el perfil no tiene límite de colaboraciones", async () => {
      const e = await armarEscenario();
      const otra = await crearColaboradora({ habilidades: [e.habilidad.codigo] });
      await colaboracionService.crearColaboracion(e.personaId, e.proyectoId, e.perfilId, false);

      await colaboracionService.crearColaboracion(otra.id, e.proyectoId, e.perfilId, false);

      expect(await ColaboracionModel.countDocuments({ activo: true })).toBe(2);
    });
  });

  describe("listados", () => {
    test("obtenerColaboraciones devuelve solo las activas, con proyecto y persona poblados", async () => {
      // Preparación
      const e = await armarEscenario();
      const otra = await crearColaboradora({ habilidades: [e.habilidad.codigo] });
      await crearColaboracion(e);
      const { colaboracionId: deBaja } = await crearColaboracion(e, { persona: otra });
      await colaboracionService.desactivarColaboracion(deBaja);

      // Ejecución
      const colaboraciones = await colaboracionService.obtenerColaboraciones();

      // Validación
      expect(colaboraciones).toHaveLength(1);
      expect(colaboraciones[0].proyecto.titulo).toBe(e.proyecto.titulo);
      expect(colaboraciones[0].personaColaboradora.nombreFantasia).toBe(e.persona.nombreFantasia);
      expect(colaboraciones[0].personaColaboradora.contactos).toBeUndefined();
    });

    test("en una colaboración anónima no se expone la persona colaboradora", async () => {
      const e = await armarEscenario();
      const { colaboracionId } = await crearColaboracion(e, { anonima: true });

      const listado = await colaboracionService.obtenerColaboraciones();
      const porId = await colaboracionService.obtenerColaboracionPorId(colaboracionId);

      expect(listado[0].anonima).toBe(true);
      expect(listado[0].personaColaboradora).toBeNull();
      expect(porId.personaColaboradora).toBeNull();
    });

    test("obtenerColaboracionPorId falla con 404 si no existe", async () => {
      await esperarAppError(
        colaboracionService.obtenerColaboracionPorId(idInexistente()),
        ErrorCatalog.COLABORACION_NO_ENCONTRADA,
        404,
      );
    });
  });

  describe("desactivarColaboracion (baja lógica)", () => {
    test("marca la colaboración inactiva con fecha de baja sin borrarla", async () => {
      // Preparación
      const e = await armarEscenario();
      const { colaboracionId } = await crearColaboracion(e);

      // Ejecución
      await colaboracionService.desactivarColaboracion(colaboracionId);

      // Validación
      const guardada = await ColaboracionModel.findById(colaboracionId).lean();
      expect(guardada).not.toBeNull();
      expect(guardada.activo).toBe(false);
      expect(guardada.fechaBaja).toBeInstanceOf(Date);
      const porId = await colaboracionService.obtenerColaboracionPorId(colaboracionId);
      expect(porId.activo).toBe(false);
    });

    test("la baja es permanente: no se puede volver a dar de baja", async () => {
      const e = await armarEscenario();
      const { colaboracionId } = await crearColaboracion(e);
      await colaboracionService.desactivarColaboracion(colaboracionId);

      await esperarAppError(
        colaboracionService.desactivarColaboracion(colaboracionId),
        ErrorCatalog.COLABORACION_YA_DADA_DE_BAJA,
        409,
      );
    });

    test("la baja es permanente: la persona no puede volver a postularse al mismo perfil", async () => {
      const e = await armarEscenario();
      const { colaboracionId } = await crearColaboracion(e);
      await colaboracionService.desactivarColaboracion(colaboracionId);

      await esperarAppError(
        postulacionService.crearPostulacion(e.proyectoId, e.perfilId, e.personaId),
        ErrorCatalog.POSTULACION_DUPLICADA,
        409,
      );
      expect(await ColaboracionModel.countDocuments({ activo: true })).toBe(0);
    });

    test("libera el cupo del perfil", async () => {
      // Preparación
      const e = await armarEscenario({ cantidadMaxima: 1 });
      const otra = await crearColaboradora({ habilidades: [e.habilidad.codigo] });
      const { colaboracionId } = await crearColaboracion(e);
      const pendiente = await postulacionService.crearPostulacion(
        e.proyectoId,
        e.perfilId,
        otra.id,
      );

      // Ejecución
      await colaboracionService.desactivarColaboracion(colaboracionId);
      await postulacionService.actualizarEstado(pendiente.id, EstadoPostulacion.ACEPTADA);

      // Validación
      const activas = await ColaboracionModel.find({ activo: true }).lean();
      expect(activas).toHaveLength(1);
      expect(activas[0].personaColaboradora.toString()).toBe(otra.id);
    });

    test("falla con 404 si la colaboración no existe", async () => {
      await esperarAppError(
        colaboracionService.desactivarColaboracion(idInexistente()),
        ErrorCatalog.COLABORACION_NO_ENCONTRADA,
        404,
      );
    });
  });

  describe("obtenerEstadisticas", () => {
    test("cuenta el total de colaboraciones, las anónimas y las públicas", async () => {
      const e = await armarEscenario();
      const otra = await crearColaboradora({ habilidades: [e.habilidad.codigo] });
      await crearColaboracion(e, { anonima: true });
      await crearColaboracion(e, { persona: otra });

      const estadisticas = await colaboracionService.obtenerEstadisticas();

      expect(estadisticas).toEqual({ total: 2, anonimas: 1, publicas: 1 });
    });
  });
});
