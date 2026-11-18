import mongoose from "mongoose";
import { usarBaseDeDatos } from "../utils/db.js";
import { esperarAppError } from "../utils/esperarAppError.js";
import {
  logroService,
  proyectoService,
  habilidadService,
  colectivoService,
} from "../../src/container.js";
import ErrorCatalog from "../../src/errors/errorCatalog.js";
import { ProyectoModel } from "../../src/schemas/proyectoSchema.js";

usarBaseDeDatos();

const nuevoId = () => new mongoose.Types.ObjectId().toString();

function logro(descripcion, porcentaje) {
  return { descripcion, porcentaje, urlCodigoFuente: "https://github.com/huerta/app" };
}

let proyectoId;

beforeEach(async () => {
  await habilidadService.crearHabilidad("Backend", "APIs y bases de datos");
  await colectivoService.crearColectivo("Huerta Comunitaria", "Huerta del barrio", "caba", "ong");
  const proyecto = await proyectoService.crearProyecto(
    "Huerta digital",
    "Sistema para organizar la huerta",
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
  );
  proyectoId = String(proyecto._id);
});

describe("LogroService.crearLogro", () => {
  test("agrega el logro al proyecto", async () => {
    // Ejecución
    const creado = await logroService.crearLogro(proyectoId, logro("MVP", 30));

    // Validación
    expect(creado._id).toBeDefined();
    expect(creado).toMatchObject(logro("MVP", 30));
    const guardado = await ProyectoModel.findById(proyectoId).lean();
    expect(guardado.logros).toHaveLength(1);
    expect(guardado.logros[0]).toMatchObject(logro("MVP", 30));
  });

  test("permite llegar exactamente al 100%", async () => {
    // Preparación
    await logroService.crearLogro(proyectoId, logro("MVP", 60));

    // Ejecución
    await logroService.crearLogro(proyectoId, logro("Release", 40));

    // Validación
    const logros = await logroService.obtenerLogros(proyectoId);
    expect(logros.reduce((total, l) => total + l.porcentaje, 0)).toBe(100);
  });

  test("rechaza un logro que haría superar el 100%", async () => {
    // Preparación
    await logroService.crearLogro(proyectoId, logro("MVP", 60));

    // Ejecución + Validación
    await esperarAppError(
      logroService.crearLogro(proyectoId, logro("Release", 41)),
      ErrorCatalog.PROYECTO_PORCENTAJE_MAXIMO,
      400,
    );
    expect(await logroService.obtenerLogros(proyectoId)).toHaveLength(1);
  });

  test("rechaza logros en un proyecto finalizado", async () => {
    // Preparación
    await proyectoService.finalizarProyecto(proyectoId);

    // Ejecución + Validación
    await esperarAppError(
      logroService.crearLogro(proyectoId, logro("MVP", 10)),
      ErrorCatalog.PROYECTO_FINALIZADO,
      400,
    );
  });

  test("falla si el proyecto no existe", async () => {
    await esperarAppError(
      logroService.crearLogro(nuevoId(), logro("MVP", 10)),
      ErrorCatalog.PROYECTO_NO_ENCONTRADO,
      404,
    );
  });
});

describe("LogroService consultas", () => {
  test("obtenerLogros devuelve los logros del proyecto", async () => {
    // Preparación
    await logroService.crearLogro(proyectoId, logro("MVP", 30));
    await logroService.crearLogro(proyectoId, logro("Beta", 20));

    // Ejecución
    const logros = await logroService.obtenerLogros(proyectoId);

    // Validación
    expect(logros.map((l) => l.descripcion)).toEqual(["MVP", "Beta"]);
  });

  test("obtenerLogros devuelve vacío si el proyecto no tiene logros", async () => {
    expect(await logroService.obtenerLogros(proyectoId)).toEqual([]);
  });

  test("obtenerLogroPorId devuelve el logro", async () => {
    // Preparación
    const creado = await logroService.crearLogro(proyectoId, logro("MVP", 30));

    // Ejecución
    const encontrado = await logroService.obtenerLogroPorId(proyectoId, creado._id);

    // Validación
    expect(encontrado).toMatchObject(logro("MVP", 30));
  });

  test("obtenerLogroPorId falla si el logro o el proyecto no existen", async () => {
    // Preparación
    const creado = await logroService.crearLogro(proyectoId, logro("MVP", 30));

    // Ejecución + Validación
    await esperarAppError(
      logroService.obtenerLogroPorId(proyectoId, nuevoId()),
      ErrorCatalog.PROYECTO_LOGRO_NO_ENCONTRADO,
      404,
    );
    await esperarAppError(
      logroService.obtenerLogroPorId(nuevoId(), creado._id),
      ErrorCatalog.PROYECTO_NO_ENCONTRADO,
      404,
    );
    await esperarAppError(
      logroService.obtenerLogros(nuevoId()),
      ErrorCatalog.PROYECTO_NO_ENCONTRADO,
      404,
    );
  });
});

describe("LogroService.actualizarLogro", () => {
  test("actualiza los campos enviados", async () => {
    // Preparación
    const creado = await logroService.crearLogro(proyectoId, logro("MVP", 30));

    // Ejecución
    const actualizado = await logroService.actualizarLogro(proyectoId, creado._id, {
      descripcion: "MVP terminado",
    });

    // Validación
    expect(actualizado).toMatchObject({ descripcion: "MVP terminado", porcentaje: 30 });
  });

  test("el cálculo del máximo descuenta el porcentaje anterior del propio logro", async () => {
    // Preparación
    await logroService.crearLogro(proyectoId, logro("MVP", 50));
    const beta = await logroService.crearLogro(proyectoId, logro("Beta", 40));

    // Ejecución
    const actualizado = await logroService.actualizarLogro(proyectoId, beta._id, {
      porcentaje: 50,
    });

    // Validación
    expect(actualizado.porcentaje).toBe(50);
  });

  test("rechaza un porcentaje que haría superar el 100%", async () => {
    // Preparación
    await logroService.crearLogro(proyectoId, logro("MVP", 50));
    const beta = await logroService.crearLogro(proyectoId, logro("Beta", 40));

    // Ejecución + Validación
    await esperarAppError(
      logroService.actualizarLogro(proyectoId, beta._id, { porcentaje: 51 }),
      ErrorCatalog.PROYECTO_PORCENTAJE_MAXIMO,
      400,
    );
    expect((await logroService.obtenerLogroPorId(proyectoId, beta._id)).porcentaje).toBe(40);
  });

  test("sin cambios devuelve el logro tal cual", async () => {
    // Preparación
    const creado = await logroService.crearLogro(proyectoId, logro("MVP", 30));

    // Ejecución
    const resultado = await logroService.actualizarLogro(proyectoId, creado._id, {});

    // Validación
    expect(resultado).toMatchObject(logro("MVP", 30));
  });

  test("falla si el proyecto está finalizado", async () => {
    // Preparación
    const creado = await logroService.crearLogro(proyectoId, logro("MVP", 30));
    await proyectoService.finalizarProyecto(proyectoId);

    // Ejecución + Validación
    await esperarAppError(
      logroService.actualizarLogro(proyectoId, creado._id, { porcentaje: 40 }),
      ErrorCatalog.PROYECTO_FINALIZADO,
      400,
    );
  });

  test("falla si el logro no existe", async () => {
    await esperarAppError(
      logroService.actualizarLogro(proyectoId, nuevoId(), { porcentaje: 10 }),
      ErrorCatalog.PROYECTO_LOGRO_NO_ENCONTRADO,
      404,
    );
  });
});

describe("LogroService.eliminarLogro", () => {
  test("elimina el logro, lo devuelve y libera su porcentaje", async () => {
    // Preparación
    const mvp = await logroService.crearLogro(proyectoId, logro("MVP", 70));
    await logroService.crearLogro(proyectoId, logro("Beta", 30));

    // Ejecución
    const eliminado = await logroService.eliminarLogro(proyectoId, mvp._id);

    // Validación
    expect(eliminado).toMatchObject(logro("MVP", 70));
    expect((await logroService.obtenerLogros(proyectoId)).map((l) => l.descripcion)).toEqual([
      "Beta",
    ]);
    await logroService.crearLogro(proyectoId, logro("Release", 70));
  });

  test("falla si el logro no existe o el proyecto está finalizado", async () => {
    // Preparación
    const creado = await logroService.crearLogro(proyectoId, logro("MVP", 30));

    // Ejecución + Validación
    await esperarAppError(
      logroService.eliminarLogro(proyectoId, nuevoId()),
      ErrorCatalog.PROYECTO_LOGRO_NO_ENCONTRADO,
      404,
    );
    await proyectoService.finalizarProyecto(proyectoId);
    await esperarAppError(
      logroService.eliminarLogro(proyectoId, creado._id),
      ErrorCatalog.PROYECTO_FINALIZADO,
      400,
    );
    expect(await logroService.obtenerLogros(proyectoId)).toHaveLength(1);
  });
});
