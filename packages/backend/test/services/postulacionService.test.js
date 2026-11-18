import { usarBaseDeDatos } from "../utils/db.js";
import { esperarAppError } from "../utils/esperarAppError.js";
import {
  armarEscenario,
  crearColaboradora,
  crearHabilidad,
  esperarHasta,
  idInexistente,
} from "../utils/escenarios.js";
import { postulacionService, proyectoService, colaboracionService } from "../../src/container.js";
import ErrorCatalog from "../../src/errors/errorCatalog.js";
import { EstadoPostulacion } from "../../src/models/postulacion.js";
import { PostulacionModel } from "../../src/schemas/postulacionSchema.js";
import { ProyectoModel } from "../../src/schemas/proyectoSchema.js";
import { ColaboracionModel } from "../../src/schemas/colaboracionSchema.js";

usarBaseDeDatos();

const ayer = () => new Date(Date.now() - 24 * 60 * 60 * 1000);
const maniana = () => new Date(Date.now() + 24 * 60 * 60 * 1000);

describe("PostulacionService", () => {
  describe("crearPostulacion", () => {
    test("una colaboradora con una habilidad requerida queda postulada en estado pendiente", async () => {
      // Preparación
      const e = await armarEscenario();

      // Ejecución
      const postulacion = await postulacionService.crearPostulacion(
        e.proyectoId,
        e.perfilId,
        e.personaId,
      );

      // Validación
      expect(postulacion.id).toBeDefined();
      expect(postulacion.estado).toBe(EstadoPostulacion.PENDIENTE);
      const guardada = await PostulacionModel.findById(postulacion.id).lean();
      expect(guardada.estado).toBe(EstadoPostulacion.PENDIENTE);
      expect(guardada.personaColaboradora.toString()).toBe(e.personaId);
      expect(guardada.proyecto.toString()).toBe(e.proyectoId);
      expect(guardada.perfil.toString()).toBe(e.perfilId);
      expect(guardada.colectivo.toString()).toBe(e.colectivoId);
      expect(guardada.anonima).toBe(false);
    });

    test("respeta el pedido de postulación anónima", async () => {
      // Preparación
      const e = await armarEscenario();

      // Ejecución
      const postulacion = await postulacionService.crearPostulacion(
        e.proyectoId,
        e.perfilId,
        e.personaId,
        true,
      );

      // Validación
      const guardada = await PostulacionModel.findById(postulacion.id).lean();
      expect(guardada.anonima).toBe(true);
    });

    test("con una fecha límite de búsqueda futura la postulación se acepta", async () => {
      // Preparación
      const e = await armarEscenario({ fechaLimiteBusqueda: maniana() });

      // Ejecución
      const postulacion = await postulacionService.crearPostulacion(
        e.proyectoId,
        e.perfilId,
        e.personaId,
      );

      // Validación
      expect(postulacion.estado).toBe(EstadoPostulacion.PENDIENTE);
    });

    test("no permite postularse dos veces al mismo perfil", async () => {
      // Preparación
      const e = await armarEscenario();
      await postulacionService.crearPostulacion(e.proyectoId, e.perfilId, e.personaId);

      // Ejecución y Validación
      await esperarAppError(
        postulacionService.crearPostulacion(e.proyectoId, e.perfilId, e.personaId),
        ErrorCatalog.POSTULACION_DUPLICADA,
        409,
      );
      expect(await PostulacionModel.countDocuments()).toBe(1);
    });

    test("no permite postularse a un proyecto finalizado", async () => {
      // Preparación
      const e = await armarEscenario();
      await proyectoService.finalizarProyecto(e.proyectoId);

      // Ejecución y Validación
      await esperarAppError(
        postulacionService.crearPostulacion(e.proyectoId, e.perfilId, e.personaId),
        ErrorCatalog.POSTULACION_PROYECTO_FINALIZADO,
        409,
      );
    });

    test("no permite postularse si la búsqueda del proyecto está cerrada", async () => {
      // Preparación
      const e = await armarEscenario();
      await ProyectoModel.updateOne({ _id: e.proyectoId }, { busquedaCerrada: true });

      // Ejecución y Validación
      await esperarAppError(
        postulacionService.crearPostulacion(e.proyectoId, e.perfilId, e.personaId),
        ErrorCatalog.POSTULACION_BUSQUEDA_CERRADA,
        409,
      );
    });

    test("no permite postularse si la fecha límite de búsqueda ya pasó", async () => {
      // Preparación
      const e = await armarEscenario({ fechaLimiteBusqueda: ayer() });

      // Ejecución y Validación
      await esperarAppError(
        postulacionService.crearPostulacion(e.proyectoId, e.perfilId, e.personaId),
        ErrorCatalog.POSTULACION_BUSQUEDA_CERRADA,
        409,
      );
    });

    test("no permite postularse sin ninguna de las habilidades requeridas del perfil", async () => {
      // Preparación
      const e = await armarEscenario();
      const otraHabilidad = await crearHabilidad();
      const sinHabilidad = await crearColaboradora({ habilidades: [otraHabilidad.codigo] });

      // Ejecución y Validación
      await esperarAppError(
        postulacionService.crearPostulacion(e.proyectoId, e.perfilId, sinHabilidad.id),
        ErrorCatalog.POSTULACION_HABILIDAD_REQUERIDA,
        400,
      );
      expect(await PostulacionModel.countDocuments()).toBe(0);
    });

    test("falla con 404 si la colaboradora, el proyecto o el perfil no existen", async () => {
      // Preparación
      const e = await armarEscenario();

      // Ejecución y Validación
      await esperarAppError(
        postulacionService.crearPostulacion(e.proyectoId, e.perfilId, idInexistente()),
        ErrorCatalog.COLABORADORA_NO_ENCONTRADA,
        404,
      );
      await esperarAppError(
        postulacionService.crearPostulacion(idInexistente(), e.perfilId, e.personaId),
        ErrorCatalog.PROYECTO_NO_ENCONTRADO,
        404,
      );
      await esperarAppError(
        postulacionService.crearPostulacion(e.proyectoId, idInexistente(), e.personaId),
        ErrorCatalog.PERFIL_NO_ENCONTRADO,
        404,
      );
    });
  });

  describe("listados", () => {
    test("obtenerDeColectivo lista las postulaciones del colectivo y filtra por estado", async () => {
      // Preparación
      const e = await armarEscenario();
      const otra = await crearColaboradora({ habilidades: [e.habilidad.codigo] });
      const p1 = await postulacionService.crearPostulacion(e.proyectoId, e.perfilId, e.personaId);
      await postulacionService.crearPostulacion(e.proyectoId, e.perfilId, otra.id);
      await postulacionService.actualizarEstado(p1.id, EstadoPostulacion.RECHAZADA);

      // Ejecución
      const todas = await postulacionService.obtenerDeColectivo(e.colectivoId);
      const pendientes = await postulacionService.obtenerDeColectivo(
        e.colectivoId,
        EstadoPostulacion.PENDIENTE,
      );
      const rechazadas = await postulacionService.obtenerDeColectivo(
        e.colectivoId,
        EstadoPostulacion.RECHAZADA,
      );

      // Validación
      expect(todas).toHaveLength(2);
      expect(pendientes).toHaveLength(1);
      expect(pendientes[0].personaColaboradora.nombreFantasia).toBe(otra.nombreFantasia);
      expect(pendientes[0].proyecto).toBe(e.proyecto.titulo);
      expect(pendientes[0].perfil).toBe(e.perfil.descripcion);
      expect(rechazadas).toHaveLength(1);
      expect(rechazadas[0].id.toString()).toBe(p1.id);
    });

    test("obtenerDeColectivo no incluye postulaciones de otros colectivos", async () => {
      // Preparación
      const e1 = await armarEscenario();
      const e2 = await armarEscenario();
      await postulacionService.crearPostulacion(e1.proyectoId, e1.perfilId, e1.personaId);
      await postulacionService.crearPostulacion(e2.proyectoId, e2.perfilId, e2.personaId);

      // Ejecución
      const deE1 = await postulacionService.obtenerDeColectivo(e1.colectivoId);

      // Validación
      expect(deE1).toHaveLength(1);
      expect(deE1[0].proyecto).toBe(e1.proyecto.titulo);
    });

    test("obtenerDeColectivo falla con 404 si el colectivo no existe", async () => {
      await esperarAppError(
        postulacionService.obtenerDeColectivo(idInexistente()),
        ErrorCatalog.COLECTIVO_NO_ENCONTRADO,
        404,
      );
    });

    test("obtenerDePersona lista las postulaciones propias con proyecto, perfil y estado", async () => {
      // Preparación
      const e = await armarEscenario();
      await postulacionService.crearPostulacion(e.proyectoId, e.perfilId, e.personaId, true);

      // Ejecución
      const postulaciones = await postulacionService.obtenerDePersona(e.personaId);

      // Validación
      expect(postulaciones).toHaveLength(1);
      expect(postulaciones[0]).toMatchObject({
        proyecto: e.proyecto.titulo,
        perfil: e.perfil.descripcion,
        estado: EstadoPostulacion.PENDIENTE,
        anonima: true,
      });
    });

    test("obtenerDePersona falla con 404 si la colaboradora no existe", async () => {
      await esperarAppError(
        postulacionService.obtenerDePersona(idInexistente()),
        ErrorCatalog.COLABORADORA_NO_ENCONTRADA,
        404,
      );
    });
  });

  describe("actualizarEstado", () => {
    test("aceptar una postulación la marca aceptada y crea la colaboración", async () => {
      // Preparación
      const e = await armarEscenario();
      const postulacion = await postulacionService.crearPostulacion(
        e.proyectoId,
        e.perfilId,
        e.personaId,
        true,
      );

      // Ejecución
      const resultado = await postulacionService.actualizarEstado(
        postulacion.id,
        EstadoPostulacion.ACEPTADA,
      );

      // Validación
      expect(resultado.estado).toBe(EstadoPostulacion.ACEPTADA);
      const colaboraciones = await ColaboracionModel.find().lean();
      expect(colaboraciones).toHaveLength(1);
      expect(colaboraciones[0]).toMatchObject({ activo: true, anonima: true });
      expect(colaboraciones[0].personaColaboradora.toString()).toBe(e.personaId);
      expect(colaboraciones[0].proyecto.toString()).toBe(e.proyectoId);
      expect(colaboraciones[0].perfil.toString()).toBe(e.perfilId);
    });

    test("rechazar una postulación no crea colaboración", async () => {
      // Preparación
      const e = await armarEscenario();
      const postulacion = await postulacionService.crearPostulacion(
        e.proyectoId,
        e.perfilId,
        e.personaId,
      );

      // Ejecución
      const resultado = await postulacionService.actualizarEstado(
        postulacion.id,
        EstadoPostulacion.RECHAZADA,
      );

      // Validación
      expect(resultado.estado).toBe(EstadoPostulacion.RECHAZADA);
      expect(await ColaboracionModel.countDocuments()).toBe(0);
    });

    test("una postulación ya resuelta no puede volver a resolverse", async () => {
      // Preparación
      const e = await armarEscenario();
      const postulacion = await postulacionService.crearPostulacion(
        e.proyectoId,
        e.perfilId,
        e.personaId,
      );
      await postulacionService.actualizarEstado(postulacion.id, EstadoPostulacion.RECHAZADA);

      // Ejecución y Validación
      await esperarAppError(
        postulacionService.actualizarEstado(postulacion.id, EstadoPostulacion.ACEPTADA),
        ErrorCatalog.POSTULACION_YA_RESUELTA,
        409,
      );
      expect(await ColaboracionModel.countDocuments()).toBe(0);
    });

    test("falla con 404 si la postulación no existe", async () => {
      await esperarAppError(
        postulacionService.actualizarEstado(idInexistente(), EstadoPostulacion.ACEPTADA),
        ErrorCatalog.POSTULACION_NO_ENCONTRADA,
        404,
      );
    });

    test("con el cupo (cantidadMaxima) completo no se pueden aceptar más postulaciones", async () => {
      // Preparación
      const e = await armarEscenario({ cantidadMaxima: 1 });
      const segunda = await crearColaboradora({ habilidades: [e.habilidad.codigo] });
      const p1 = await postulacionService.crearPostulacion(e.proyectoId, e.perfilId, e.personaId);
      const p2 = await postulacionService.crearPostulacion(e.proyectoId, e.perfilId, segunda.id);
      await postulacionService.actualizarEstado(p1.id, EstadoPostulacion.ACEPTADA);

      // Ejecución y Validación
      await esperarAppError(
        postulacionService.actualizarEstado(p2.id, EstadoPostulacion.ACEPTADA),
        ErrorCatalog.COLABORACION_CUPO_COMPLETO,
        409,
      );
      expect(await ColaboracionModel.countDocuments()).toBe(1);
      const p2Guardada = await PostulacionModel.findById(p2.id).lean();
      expect(p2Guardada.estado).toBe(EstadoPostulacion.PENDIENTE);
    });

    test("al dar de baja una colaboración se libera el cupo y se puede aceptar otra", async () => {
      // Preparación
      const e = await armarEscenario({ cantidadMaxima: 1 });
      const segunda = await crearColaboradora({ habilidades: [e.habilidad.codigo] });
      const p1 = await postulacionService.crearPostulacion(e.proyectoId, e.perfilId, e.personaId);
      const p2 = await postulacionService.crearPostulacion(e.proyectoId, e.perfilId, segunda.id);
      await postulacionService.actualizarEstado(p1.id, EstadoPostulacion.ACEPTADA);
      const colaboracion = await ColaboracionModel.findOne().lean();
      await colaboracionService.desactivarColaboracion(colaboracion._id.toString());

      // Ejecución
      const resultado = await postulacionService.actualizarEstado(
        p2.id,
        EstadoPostulacion.ACEPTADA,
      );

      // Validación
      expect(resultado.estado).toBe(EstadoPostulacion.ACEPTADA);
      expect(await ColaboracionModel.countDocuments({ activo: true })).toBe(1);
    });
  });

  describe("cierre de proyectos", () => {
    test("al finalizar un proyecto se rechazan sus postulaciones pendientes", async () => {
      // Preparación
      const e = await armarEscenario();
      const postulacion = await postulacionService.crearPostulacion(
        e.proyectoId,
        e.perfilId,
        e.personaId,
      );

      // Ejecución
      await proyectoService.finalizarProyecto(e.proyectoId);

      // Validación
      const guardada = await esperarHasta(async () => {
        const p = await PostulacionModel.findById(postulacion.id).lean();
        return p.estado === EstadoPostulacion.RECHAZADA ? p : null;
      });
      expect(guardada.fechaResolucion).toBeInstanceOf(Date);
    });
  });

  describe("datos de contacto (enunciado)", () => {
    const contactos = [{ tipo: "email", valor: "ana@contacto.test" }];

    test("mientras la postulación está pendiente el colectivo no ve los datos de contacto", async () => {
      // Preparación
      const e = await armarEscenario({ contactos });
      await postulacionService.crearPostulacion(e.proyectoId, e.perfilId, e.personaId);

      // Ejecución
      const [vista] = await postulacionService.obtenerDeColectivo(e.colectivoId);

      // Validación
      expect(vista.personaColaboradora.contactos).toBeUndefined();
      expect(JSON.stringify(vista)).not.toContain("ana@contacto.test");
    });

    // BUG: el enunciado pide que los datos de contacto de la colaboradora queden disponibles
    // para el colectivo una vez aceptada la postulación, pero ninguna vista del colectivo los
    // expone (aVistaDeColectivo no incluye contactos y el schema los tiene select:false).
    test.failing(
      "al aceptar la postulación el colectivo puede ver los datos de contacto",
      async () => {
        // Preparación
        const e = await armarEscenario({ contactos });
        const postulacion = await postulacionService.crearPostulacion(
          e.proyectoId,
          e.perfilId,
          e.personaId,
        );
        await postulacionService.actualizarEstado(postulacion.id, EstadoPostulacion.ACEPTADA);

        // Ejecución
        const [vista] = await postulacionService.obtenerDeColectivo(
          e.colectivoId,
          EstadoPostulacion.ACEPTADA,
        );

        // Validación
        expect(vista.personaColaboradora.contactos).toEqual(contactos);
      },
    );
  });
});
