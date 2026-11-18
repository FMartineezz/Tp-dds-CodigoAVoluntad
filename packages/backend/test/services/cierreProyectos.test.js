import { setTimeout as dormir } from "node:timers/promises";
import mongoose from "mongoose";
import { usarBaseDeDatos } from "../utils/db.js";
import { esperarAppError } from "../utils/esperarAppError.js";
import {
  cierreProyectos,
  proyectoService,
  postulacionService,
  personaColaboradoraService,
  habilidadService,
  colectivoService,
} from "../../src/container.js";
import ErrorCatalog from "../../src/errors/errorCatalog.js";
import { EstadoPostulacion } from "../../src/models/postulacion.js";
import { PostulacionModel } from "../../src/schemas/postulacionSchema.js";
import { ProyectoModel } from "../../src/schemas/proyectoSchema.js";

usarBaseDeDatos();

const UNA_HORA = 60 * 60 * 1000;

// El rechazo de postulaciones al cerrar un proyecto se dispara por un evento (EventEmitter) cuyo
// listener es async y no se espera: se consulta la base real hasta que se cumpla la condición.
async function esperarHasta(condicion, { timeout = 3000, intervalo = 25 } = {}) {
  const limite = Date.now() + timeout;
  while (Date.now() < limite) {
    if (await condicion()) return;
    await dormir(intervalo);
  }
  throw new Error("La condición no se cumplió a tiempo");
}

const estadoDe = async (postulacionId) =>
  (await PostulacionModel.findById(postulacionId).lean()).estado;

async function esperarEstado(postulacionId, estado) {
  await esperarHasta(async () => (await estadoDe(postulacionId)) === estado);
}

let personas;

async function crearProyecto(titulo, { fechaCierre, fechaLimiteBusqueda } = {}) {
  const creado = await proyectoService.crearProyecto(
    titulo,
    "Descripción",
    [
      {
        descripcion: "Desarrollo backend",
        habilidadesRequeridas: ["backend"],
        habilidadesOpcionales: [],
        horas: 10,
        tipoDeCompromiso: "semanal",
        modalidadDeColaboracion: "gratuita",
      },
    ],
    "Huerta Comunitaria",
    "https://huerta.org",
    fechaCierre,
    fechaLimiteBusqueda,
  );
  const proyecto = await proyectoService.obtenerProyectoPorId(creado._id);
  return { proyectoId: String(proyecto._id), perfilId: String(proyecto.perfiles[0]._id) };
}

function postular({ proyectoId, perfilId }, persona) {
  return postulacionService.crearPostulacion(proyectoId, perfilId, String(persona.id));
}

beforeEach(async () => {
  await habilidadService.crearHabilidad("Backend", "APIs y bases de datos");
  await colectivoService.crearColectivo("Huerta Comunitaria", "Huerta del barrio", "caba", "ong");
  personas = [];
  for (const nombre of ["Ana", "Beto", "Caro"]) {
    personas.push(
      await personaColaboradoraService.crearPersonaColaboradora(
        `${nombre}Dev`,
        `https://github.com/${nombre.toLowerCase()}`,
        nombre,
        "Pérez",
        ["backend"],
        [],
        "Hola",
        [{ tipo: "email", valor: `${nombre.toLowerCase()}@mail.com` }],
        false,
      ),
    );
  }
});

describe("Cierre manual de proyectos", () => {
  test("finalizarProyecto rechaza las postulaciones pendientes y respeta las ya resueltas", async () => {
    // Preparación
    const proyecto = await crearProyecto("Huerta digital");
    const pendiente = await postular(proyecto, personas[0]);
    const aceptada = await postular(proyecto, personas[1]);
    await postulacionService.actualizarEstado(aceptada.id, EstadoPostulacion.ACEPTADA);

    // Ejecución
    await proyectoService.finalizarProyecto(proyecto.proyectoId);

    // Validación
    await esperarEstado(pendiente.id, EstadoPostulacion.RECHAZADA);
    const rechazada = await PostulacionModel.findById(pendiente.id).lean();
    expect(rechazada.fechaResolucion).toBeInstanceOf(Date);
    expect(await estadoDe(aceptada.id)).toBe(EstadoPostulacion.ACEPTADA);
    expect((await ProyectoModel.findById(proyecto.proyectoId).lean()).finalizado).toBe(true);
  });

  test("no afecta las postulaciones de otros proyectos", async () => {
    // Preparación
    const cerrado = await crearProyecto("Cerrado");
    const abierto = await crearProyecto("Abierto");
    const delCerrado = await postular(cerrado, personas[0]);
    const delAbierto = await postular(abierto, personas[0]);

    // Ejecución
    await proyectoService.finalizarProyecto(cerrado.proyectoId);

    // Validación
    await esperarEstado(delCerrado.id, EstadoPostulacion.RECHAZADA);
    expect(await estadoDe(delAbierto.id)).toBe(EstadoPostulacion.PENDIENTE);
  });

  test("cerrar vía actualizarProyecto (PATCH finalizado) también rechaza las pendientes", async () => {
    // Preparación
    const proyecto = await crearProyecto("Huerta digital");
    const pendiente = await postular(proyecto, personas[0]);

    // Ejecución
    await proyectoService.actualizarProyecto(proyecto.proyectoId, { finalizado: true });

    // Validación
    await esperarEstado(pendiente.id, EstadoPostulacion.RECHAZADA);
  });

  test("después de cerrar no se pueden crear postulaciones nuevas", async () => {
    // Preparación
    const proyecto = await crearProyecto("Huerta digital");
    await proyectoService.finalizarProyecto(proyecto.proyectoId);

    // Ejecución + Validación
    await esperarAppError(
      postular(proyecto, personas[2]),
      ErrorCatalog.POSTULACION_PROYECTO_FINALIZADO,
      409,
    );
    expect(await PostulacionModel.countDocuments()).toBe(0);
  });

  test("no se puede finalizar dos veces ni un proyecto inexistente", async () => {
    // Preparación
    const proyecto = await crearProyecto("Huerta digital");
    await proyectoService.finalizarProyecto(proyecto.proyectoId);

    // Ejecución + Validación
    await esperarAppError(
      proyectoService.finalizarProyecto(proyecto.proyectoId),
      ErrorCatalog.PROYECTO_FINALIZADO,
      400,
    );
    await esperarAppError(
      proyectoService.finalizarProyecto(new mongoose.Types.ObjectId().toString()),
      ErrorCatalog.PROYECTO_NO_ENCONTRADO,
      404,
    );
  });

  test("una postulación rechazada por el cierre ya no puede aceptarse", async () => {
    // Preparación
    const proyecto = await crearProyecto("Huerta digital");
    const pendiente = await postular(proyecto, personas[0]);
    await proyectoService.finalizarProyecto(proyecto.proyectoId);
    await esperarEstado(pendiente.id, EstadoPostulacion.RECHAZADA);

    // Ejecución + Validación
    await esperarAppError(
      postulacionService.actualizarEstado(pendiente.id, EstadoPostulacion.ACEPTADA),
      ErrorCatalog.POSTULACION_YA_RESUELTA,
      409,
    );
  });
});

describe("Cierre automático de proyectos (job de cierre)", () => {
  // El job (src/cronTasks/cierreProyectoJob.js) en cada tick ejecuta
  // proyectoService.cerrarProyectosSi(new Date()). Se invoca ese mismo método a través del service
  // que tiene inyectado el job del container, sin esperar al cron.
  const ejecutarCierreAutomatico = (fecha = new Date()) =>
    cierreProyectos.proyectoService.cerrarProyectosSi(fecha);

  test("el job usa el proyectoService real del container", () => {
    expect(cierreProyectos.proyectoService).toBe(proyectoService);
  });

  test("cierra solo los proyectos con fechaCierre vencida", async () => {
    // Preparación
    const vencido = await crearProyecto("Vencido", {
      fechaCierre: new Date(Date.now() - UNA_HORA),
    });
    const futuro = await crearProyecto("Futuro", { fechaCierre: new Date(Date.now() + UNA_HORA) });
    const sinFecha = await crearProyecto("Sin fecha");

    // Ejecución
    await ejecutarCierreAutomatico();

    // Validación
    const finalizado = async ({ proyectoId }) =>
      (await ProyectoModel.findById(proyectoId).lean()).finalizado;
    expect(await finalizado(vencido)).toBe(true);
    expect(await finalizado(futuro)).toBe(false);
    expect(await finalizado(sinFecha)).toBe(false);
  });

  test("al cerrar automáticamente rechaza las pendientes y respeta las aceptadas", async () => {
    // Preparación: se postula mientras está abierto y después la fechaCierre pasa a estar vencida
    const proyecto = await crearProyecto("Huerta digital", {
      fechaCierre: new Date(Date.now() + UNA_HORA),
    });
    const pendiente = await postular(proyecto, personas[0]);
    const aceptada = await postular(proyecto, personas[1]);
    await postulacionService.actualizarEstado(aceptada.id, EstadoPostulacion.ACEPTADA);
    await proyectoService.actualizarProyecto(proyecto.proyectoId, {
      fechaCierre: new Date(Date.now() - 1000),
    });

    // Ejecución
    await ejecutarCierreAutomatico();

    // Validación
    await esperarEstado(pendiente.id, EstadoPostulacion.RECHAZADA);
    expect(await estadoDe(aceptada.id)).toBe(EstadoPostulacion.ACEPTADA);
  });

  test("después del cierre automático no se pueden crear postulaciones nuevas", async () => {
    // Preparación
    const proyecto = await crearProyecto("Huerta digital", {
      fechaCierre: new Date(Date.now() - UNA_HORA),
    });
    await ejecutarCierreAutomatico();

    // Ejecución + Validación
    await esperarAppError(
      postular(proyecto, personas[0]),
      ErrorCatalog.POSTULACION_PROYECTO_FINALIZADO,
      409,
    );
  });

  test("un proyecto vencido sigue aceptando postulaciones hasta que corre el job", async () => {
    // Preparación
    const proyecto = await crearProyecto("Huerta digital", {
      fechaCierre: new Date(Date.now() - UNA_HORA),
    });

    // Ejecución
    const postulacion = await postular(proyecto, personas[0]);
    await ejecutarCierreAutomatico();

    // Validación: el job la rechaza al cerrar
    await esperarEstado(postulacion.id, EstadoPostulacion.RECHAZADA);
  });

  test("no vuelve a tocar proyectos ya finalizados ni sus postulaciones resueltas", async () => {
    // Preparación
    const proyecto = await crearProyecto("Huerta digital", {
      fechaCierre: new Date(Date.now() + UNA_HORA),
    });
    const aceptada = await postular(proyecto, personas[0]);
    await postulacionService.actualizarEstado(aceptada.id, EstadoPostulacion.ACEPTADA);
    await proyectoService.finalizarProyecto(proyecto.proyectoId);

    // Ejecución
    await ejecutarCierreAutomatico(new Date(Date.now() + 2 * UNA_HORA));

    // Validación
    expect(await estadoDe(aceptada.id)).toBe(EstadoPostulacion.ACEPTADA);
    expect((await ProyectoModel.findById(proyecto.proyectoId).lean()).finalizado).toBe(true);
  });

  test("usa la fecha recibida como 'ahora' para decidir qué cerrar", async () => {
    // Preparación
    const proyecto = await crearProyecto("Huerta digital", {
      fechaCierre: new Date(Date.now() + UNA_HORA),
    });

    // Ejecución
    await ejecutarCierreAutomatico(new Date(Date.now() + 2 * UNA_HORA));

    // Validación
    expect((await ProyectoModel.findById(proyecto.proyectoId).lean()).finalizado).toBe(true);
  });
});

describe("Búsqueda cerrada por fechaLimiteBusqueda", () => {
  test("no se puede postular si la fecha límite de búsqueda pasó, aunque el proyecto siga abierto", async () => {
    // Preparación
    const proyecto = await crearProyecto("Huerta digital", {
      fechaLimiteBusqueda: new Date(Date.now() - UNA_HORA),
    });

    // Ejecución + Validación
    await esperarAppError(
      postular(proyecto, personas[0]),
      ErrorCatalog.POSTULACION_BUSQUEDA_CERRADA,
      409,
    );
  });
});
