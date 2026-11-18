import { usarBaseDeDatos } from "../utils/db.js";
import { esperarAppError } from "../utils/esperarAppError.js";
import {
  crearColaboradora,
  crearColectivo,
  crearHabilidad,
  crearProyecto,
  esperarHasta,
  idInexistente,
  pausa,
} from "../utils/escenarios.js";
import { notificacionAutomaticaService, proyectoService } from "../../src/container.js";
import ErrorCatalog from "../../src/errors/errorCatalog.js";
import { DestinatarioNotificacion } from "../../src/models/notificacion.js";
import { NotificacionModel } from "../../src/schemas/notificacionSchema.js";

usarBaseDeDatos();

// Registra los listeners reales de src/events/events.js (una sola vez para el archivo).
beforeAll(() => notificacionAutomaticaService.iniciar());

// Los listeners corren en segundo plano: se deja que terminen antes de seguir/limpiar la base.
const esperarListeners = () => pausa(200);

const notificacionesPara = (destinatario) => NotificacionModel.find({ destinatario }).lean();

const esperarNotificaciones = (destinatario, cantidad) =>
  esperarHasta(async () => {
    const encontradas = await notificacionesPara(destinatario);
    return encontradas.length >= cantidad ? encontradas : null;
  });

describe("NotificacionAutomaticaService", () => {
  describe("al publicarse un proyecto (evento proyectoCreado)", () => {
    test("notifica a las colaboradoras con alguna habilidad requerida", async () => {
      // Preparación
      const habilidad = await crearHabilidad();
      const colectivo = await crearColectivo();
      const acorde = await crearColaboradora({ habilidades: [habilidad.codigo], nombre: "Ana" });
      const otraHabilidad = await crearHabilidad();
      await crearColaboradora({ habilidades: [otraHabilidad.codigo] });
      await esperarListeners();

      // Ejecución
      const proyecto = await crearProyecto({
        colectivo,
        perfiles: [{ habilidadesRequeridas: [habilidad.codigo] }],
      });

      // Validación
      const [notificacion] = await esperarNotificaciones(DestinatarioNotificacion.PERSONA, 1);
      await esperarListeners();
      expect(await notificacionesPara(DestinatarioNotificacion.PERSONA)).toHaveLength(1);
      expect(notificacion.personaColaboradora.toString()).toBe(acorde.id);
      expect(notificacion.proyecto.toString()).toBe(proyecto.id);
      expect(notificacion.colectivo.toString()).toBe(colectivo.id);
      expect(notificacion.texto).toContain("Ana");
      expect(notificacion.texto).toContain(proyecto.titulo);
      expect(notificacion.texto).toContain(colectivo.nombre);
    });

    test("no notifica si nadie tiene las habilidades requeridas", async () => {
      // Preparación
      const habilidad = await crearHabilidad();
      const otra = await crearHabilidad();
      const colectivo = await crearColectivo();
      await crearColaboradora({ habilidades: [otra.codigo] });
      await esperarListeners();

      // Ejecución
      await crearProyecto({ colectivo, perfiles: [{ habilidadesRequeridas: [habilidad.codigo] }] });
      await esperarListeners();

      // Validación
      expect(await NotificacionModel.countDocuments()).toBe(0);
    });

    // BUG: el texto usa `persona.nombre`, que es opcional; si la colaboradora no lo cargó la
    // notificación dice "Hola null!" en lugar de usar, por ejemplo, el nombre de fantasía.
    test.failing("el saludo no muestra 'null' si la colaboradora no cargó su nombre", async () => {
      const habilidad = await crearHabilidad();
      const colectivo = await crearColectivo();
      await crearColaboradora({ habilidades: [habilidad.codigo], nombre: null });
      await esperarListeners();

      await crearProyecto({ colectivo, perfiles: [{ habilidadesRequeridas: [habilidad.codigo] }] });

      const [notificacion] = await esperarNotificaciones(DestinatarioNotificacion.PERSONA, 1);
      await esperarListeners();
      expect(notificacion.texto).not.toContain("null");
    });
  });

  describe("al registrarse una colaboradora (evento personaColaboradoraCreada)", () => {
    test("notifica a los colectivos con proyectos acordes a sus habilidades", async () => {
      // Preparación
      const habilidad = await crearHabilidad();
      const colectivo = await crearColectivo();
      const proyecto = await crearProyecto({
        colectivo,
        perfiles: [{ habilidadesRequeridas: [habilidad.codigo] }],
      });
      await esperarListeners();

      // Ejecución
      const persona = await crearColaboradora({ habilidades: [habilidad.codigo] });

      // Validación
      const [notificacion] = await esperarNotificaciones(DestinatarioNotificacion.COLECTIVO, 1);
      await esperarListeners();
      expect(notificacion.colectivo.toString()).toBe(colectivo.id);
      expect(notificacion.proyecto.toString()).toBe(proyecto.id);
      expect(notificacion.personaColaboradora.toString()).toBe(persona.id);
      expect(notificacion.texto).toContain(persona.nombreFantasia);
      expect(notificacion.texto).toContain(colectivo.nombre);
    });

    test("no notifica por proyectos finalizados", async () => {
      // Preparación
      const habilidad = await crearHabilidad();
      const colectivo = await crearColectivo();
      const proyecto = await crearProyecto({
        colectivo,
        perfiles: [{ habilidadesRequeridas: [habilidad.codigo] }],
      });
      await proyectoService.finalizarProyecto(proyecto.id);
      await esperarListeners();

      // Ejecución
      await crearColaboradora({ habilidades: [habilidad.codigo] });
      await esperarListeners();

      // Validación
      expect(await NotificacionModel.countDocuments()).toBe(0);
    });
  });

  describe("llamadas directas", () => {
    test("notificarAPersonasColaboradoras no duplica notificaciones del mismo proyecto", async () => {
      // Preparación
      const habilidad = await crearHabilidad();
      const colectivo = await crearColectivo();
      await crearColaboradora({ habilidades: [habilidad.codigo] });
      await esperarListeners();
      const proyecto = await crearProyecto({
        colectivo,
        perfiles: [{ habilidadesRequeridas: [habilidad.codigo] }],
      });
      await esperarNotificaciones(DestinatarioNotificacion.PERSONA, 1);

      // Ejecución
      await notificacionAutomaticaService.notificarAPersonasColaboradoras(
        proyecto,
        colectivo.nombre,
      );
      await notificacionAutomaticaService.notificarAPersonasColaboradoras(
        proyecto,
        colectivo.nombre,
      );

      // Validación
      expect(await notificacionesPara(DestinatarioNotificacion.PERSONA)).toHaveLength(1);
    });

    test("notificarAColectivos crea una notificación por cada proyecto acorde", async () => {
      // Preparación
      const habilidad = await crearHabilidad();
      const colectivo = await crearColectivo();
      await crearProyecto({ colectivo, perfiles: [{ habilidadesRequeridas: [habilidad.codigo] }] });
      await crearProyecto({ colectivo, perfiles: [{ habilidadesRequeridas: [habilidad.codigo] }] });
      await esperarListeners();
      const persona = await crearColaboradora({ habilidades: [habilidad.codigo] });
      await esperarNotificaciones(DestinatarioNotificacion.COLECTIVO, 2);
      await NotificacionModel.deleteMany({});

      // Ejecución
      await notificacionAutomaticaService.notificarAColectivos({ _id: persona.id, ...persona });

      // Validación
      expect(await notificacionesPara(DestinatarioNotificacion.COLECTIVO)).toHaveLength(2);
    });
  });

  describe("consultas", () => {
    test("cada destinatario ve solo sus notificaciones", async () => {
      // Preparación
      const habilidad = await crearHabilidad();
      const colectivo = await crearColectivo();
      const persona = await crearColaboradora({ habilidades: [habilidad.codigo] });
      await esperarListeners();
      const proyecto = await crearProyecto({
        colectivo,
        perfiles: [{ habilidadesRequeridas: [habilidad.codigo] }],
      });
      await esperarNotificaciones(DestinatarioNotificacion.PERSONA, 1);
      const nueva = await crearColaboradora({ habilidades: [habilidad.codigo] });
      await esperarNotificaciones(DestinatarioNotificacion.COLECTIVO, 1);
      await esperarListeners();

      // Ejecución
      const dePersona =
        await notificacionAutomaticaService.obtenerNotificacionesDePersonaColaboradora(persona.id);
      const delColectivo = await notificacionAutomaticaService.obtenerNotificacionesDelColectivo(
        colectivo.id,
      );

      // Validación
      expect(dePersona).toHaveLength(1);
      expect(dePersona[0].proyecto.titulo).toBe(proyecto.titulo);
      expect(delColectivo).toHaveLength(1);
      expect(delColectivo[0].personaColaboradora.nombreFantasia).toBe(nueva.nombreFantasia);
    });

    test("fallan con 404 si la colaboradora o el colectivo no existen", async () => {
      await esperarAppError(
        notificacionAutomaticaService.obtenerNotificacionesDePersonaColaboradora(idInexistente()),
        ErrorCatalog.COLABORADORA_NO_ENCONTRADA,
        404,
      );
      await esperarAppError(
        notificacionAutomaticaService.obtenerNotificacionesDelColectivo(idInexistente()),
        ErrorCatalog.COLECTIVO_NO_ENCONTRADO,
        404,
      );
    });
  });
});
