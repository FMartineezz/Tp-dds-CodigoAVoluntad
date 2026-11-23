import mongoose from "mongoose";
import { consultasA, usarBaseDeDatos } from "../utils/db.js";
import { esperarAppError } from "../utils/esperarAppError.js";
import { proyectoService, habilidadService, colectivoService } from "../../src/container.js";
import ErrorCatalog from "../../src/errors/errorCatalog.js";
import { ProyectoModel } from "../../src/schemas/proyectoSchema.js";

usarBaseDeDatos();

const UNA_HORA = 60 * 60 * 1000;

function perfilBase(cambios = {}) {
  return {
    descripcion: "Desarrollo backend",
    habilidadesRequeridas: ["backend"],
    habilidadesOpcionales: ["frontend"],
    horas: 10,
    tipoDeCompromiso: "semanal",
    modalidadDeColaboracion: "gratuita",
    ...cambios,
  };
}

function crearProyecto({
  titulo = "Huerta digital",
  perfiles = [perfilBase()],
  colectivo = "Huerta Comunitaria",
  fechaCierre,
  fechaLimiteBusqueda,
  urlDonaciones,
} = {}) {
  return proyectoService.crearProyecto(
    titulo,
    "Sistema para organizar la huerta",
    perfiles,
    colectivo,
    "https://huerta.org",
    fechaCierre,
    fechaLimiteBusqueda,
    urlDonaciones,
  );
}

beforeEach(async () => {
  await habilidadService.crearHabilidad("Backend", "APIs y bases de datos");
  await habilidadService.crearHabilidad("Frontend", "Interfaces web");
  await colectivoService.crearColectivo("Huerta Comunitaria", "Huerta del barrio", "caba", "ong");
});

describe("ProyectoService.crearProyecto", () => {
  test("busca las habilidades de TODOS los perfiles con una sola consulta (sin N+1)", async () => {
    // Preparación: 3 perfiles con 2 habilidades cada uno
    const perfiles = [
      perfilBase({ descripcion: "Uno" }),
      perfilBase({ descripcion: "Dos", habilidadesRequeridas: ["frontend"] }),
      perfilBase({ descripcion: "Tres" }),
    ];

    // Ejecución
    const consultas = await consultasA("habilidades", () => crearProyecto({ perfiles }));

    // Validación: una única consulta a habilidades, no una por perfil ni por habilidad
    expect(consultas).toEqual(["find"]);
  });

  test("crea el proyecto con sus perfiles, resuelve las habilidades y lo agrega al colectivo", async () => {
    // Preparación
    const [backend, frontend] = await habilidadService.obtenerHabilidades();

    // Ejecución
    const proyecto = await crearProyecto({ perfiles: [perfilBase({ cantidadMaxima: 3 })] });

    // Validación
    const guardado = await ProyectoModel.findById(proyecto._id).lean();
    expect(guardado).toMatchObject({
      titulo: "Huerta digital",
      urlSistema: "https://huerta.org",
      finalizado: false,
      busquedaCerrada: false,
      urlDonaciones: null,
      logros: [],
    });
    expect(guardado.perfiles).toHaveLength(1);
    expect(guardado.perfiles[0]).toMatchObject({
      descripcion: "Desarrollo backend",
      horas: 10,
      tipoDeCompromiso: "semanal",
      modalidadDeColaboracion: "gratuita",
      cantidadMaxima: 3,
    });
    expect(guardado.perfiles[0]._id).toBeDefined();
    expect(guardado.perfiles[0].habilidadesRequeridas.map(String)).toEqual([String(backend._id)]);
    expect(guardado.perfiles[0].habilidadesOpcionales.map(String)).toEqual([String(frontend._id)]);

    const colectivo = await colectivoService.obtenerColectivoPorNombre("Huerta Comunitaria");
    expect(String(guardado.colectivo)).toBe(String(colectivo._id));
    expect(colectivo.proyectos.map(String)).toContain(String(proyecto._id));
  });

  test("un perfil sin cantidadMaxima queda sin cupo definido", async () => {
    // Ejecución
    const proyecto = await crearProyecto();

    // Validación
    const guardado = await ProyectoModel.findById(proyecto._id).lean();
    expect(guardado.perfiles[0].cantidadMaxima).toBeUndefined();
  });

  test("guarda fechaCierre, fechaLimiteBusqueda y urlDonaciones", async () => {
    // Preparación
    const fechaCierre = new Date(Date.now() + 48 * UNA_HORA);
    const fechaLimiteBusqueda = new Date(Date.now() + 24 * UNA_HORA);

    // Ejecución
    const proyecto = await crearProyecto({
      fechaCierre,
      fechaLimiteBusqueda,
      urlDonaciones: "https://cafecito.app/huerta",
    });

    // Validación
    const guardado = await proyectoService.obtenerProyectoPorId(proyecto._id);
    expect(guardado.fechaCierre).toEqual(fechaCierre);
    expect(guardado.fechaLimiteBusqueda).toEqual(fechaLimiteBusqueda);
    expect(guardado.urlDonaciones).toBe("https://cafecito.app/huerta");
  });

  test("una urlDonaciones vacía se guarda como null", async () => {
    // Ejecución
    const proyecto = await crearProyecto({ urlDonaciones: "" });

    // Validación
    const guardado = await proyectoService.obtenerProyectoPorId(proyecto._id);
    expect(guardado.urlDonaciones).toBeNull();
  });

  test("rechaza una urlDonaciones que no es http/https", async () => {
    // Ejecución + Validación
    await esperarAppError(
      crearProyecto({ urlDonaciones: "ftp://donaciones.org" }),
      ErrorCatalog.PROYECTO_URL_DONACIONES_INVALIDA,
      400,
    );
    expect(await ProyectoModel.countDocuments()).toBe(0);
  });

  test("rechaza un título repetido dentro del mismo colectivo", async () => {
    // Preparación
    await crearProyecto();

    // Ejecución + Validación
    await esperarAppError(crearProyecto(), ErrorCatalog.PROYECTO_YA_EXISTENTE, 409);
    expect(await ProyectoModel.countDocuments()).toBe(1);
  });

  test("permite el mismo título en otro colectivo", async () => {
    // Preparación
    await colectivoService.crearColectivo("Otra Huerta", "Otra", "cordoba", "asamblea");
    await crearProyecto();

    // Ejecución
    await crearProyecto({ colectivo: "Otra Huerta" });

    // Validación
    expect(await ProyectoModel.countDocuments({ titulo: "Huerta digital" })).toBe(2);
  });

  test("falla si el colectivo no existe", async () => {
    // Ejecución + Validación
    await esperarAppError(
      crearProyecto({ colectivo: "No existe" }),
      ErrorCatalog.COLECTIVO_NO_ENCONTRADO_POR_NOMBRE,
      400,
    );
    expect(await ProyectoModel.countDocuments()).toBe(0);
  });

  test("falla si alguna habilidad de un perfil no existe y no guarda nada", async () => {
    // Ejecución + Validación
    await esperarAppError(
      crearProyecto({
        perfiles: [perfilBase({ habilidadesRequeridas: ["backend", "cobol"] })],
      }),
      ErrorCatalog.HABILIDADES_INEXISTENTES_GENERICO,
      400,
    );
    expect(await ProyectoModel.countDocuments()).toBe(0);
  });

  test("también falla si la habilidad inexistente es opcional", async () => {
    // Ejecución + Validación
    await esperarAppError(
      crearProyecto({ perfiles: [perfilBase({ habilidadesOpcionales: ["cobol"] })] }),
      ErrorCatalog.HABILIDADES_INEXISTENTES_GENERICO,
      400,
    );
  });
});

describe("ProyectoService.estaBusquedaAbierta", () => {
  test("está abierta sin fecha límite", async () => {
    // Preparación
    const { _id } = await crearProyecto();
    const proyecto = await proyectoService.obtenerProyectoPorId(_id);

    // Ejecución + Validación
    expect(proyectoService.estaBusquedaAbierta(proyecto)).toBe(true);
  });

  test("está abierta si la fecha límite es futura", async () => {
    // Preparación
    const { _id } = await crearProyecto({
      fechaLimiteBusqueda: new Date(Date.now() + UNA_HORA),
    });
    const proyecto = await proyectoService.obtenerProyectoPorId(_id);

    // Ejecución + Validación
    expect(proyectoService.estaBusquedaAbierta(proyecto)).toBe(true);
  });

  test("está cerrada si la fecha límite ya pasó", async () => {
    // Preparación
    const { _id } = await crearProyecto({
      fechaLimiteBusqueda: new Date(Date.now() - UNA_HORA),
    });
    const proyecto = await proyectoService.obtenerProyectoPorId(_id);

    // Ejecución + Validación
    expect(proyectoService.estaBusquedaAbierta(proyecto)).toBe(false);
  });

  test("está cerrada si busquedaCerrada es true", async () => {
    // Preparación
    const { _id } = await crearProyecto();
    await ProyectoModel.updateOne({ _id }, { busquedaCerrada: true });
    const proyecto = await proyectoService.obtenerProyectoPorId(_id);

    // Ejecución + Validación
    expect(proyectoService.estaBusquedaAbierta(proyecto)).toBe(false);
  });
});

describe("ProyectoService consultas", () => {
  test("obtenerProyectos devuelve todos los proyectos", async () => {
    // Preparación
    await crearProyecto({ titulo: "Uno" });
    await crearProyecto({ titulo: "Dos" });

    // Ejecución
    const { resultados: proyectos, total } = await proyectoService.obtenerProyectos({
      pagina: 1,
      limite: 20,
    });

    // Validación
    expect(proyectos.map((p) => p.titulo).sort()).toEqual(["Dos", "Uno"]);
    expect(total).toBe(2);
  });

  test("obtenerProyectos devuelve una lista vacía si no hay proyectos", async () => {
    expect(await proyectoService.obtenerProyectos({ pagina: 1, limite: 20 })).toEqual({
      resultados: [],
      total: 0,
    });
  });

  test("obtenerProyectoPorId falla con un id inexistente", async () => {
    // Ejecución + Validación
    await esperarAppError(
      proyectoService.obtenerProyectoPorId(new mongoose.Types.ObjectId().toString()),
      ErrorCatalog.PROYECTO_NO_ENCONTRADO,
      404,
    );
  });

  test("obtenerProyectosConAlgunaHabilidad filtra por habilidad requerida y excluye finalizados", async () => {
    // Preparación
    const backend = await habilidadService.obtenerHabilidadPorCodigo("backend");
    const frontend = await habilidadService.obtenerHabilidadPorCodigo("frontend");
    await crearProyecto({ titulo: "Con backend" });
    await crearProyecto({
      titulo: "Solo front",
      perfiles: [perfilBase({ habilidadesRequeridas: ["frontend"], habilidadesOpcionales: [] })],
    });
    const finalizado = await crearProyecto({ titulo: "Finalizado" });
    await proyectoService.finalizarProyecto(finalizado._id);

    // Ejecución
    const conBackend = await proyectoService.obtenerProyectosConAlgunaHabilidad([backend._id]);
    const conFront = await proyectoService.obtenerProyectosConAlgunaHabilidad([frontend._id]);

    // Validación
    expect(conBackend.map((p) => p.titulo)).toEqual(["Con backend"]);
    expect(conBackend[0].colectivo.nombre).toBe("Huerta Comunitaria");
    expect(conFront.map((p) => p.titulo)).toEqual(["Solo front"]);
  });
});

describe("ProyectoService.actualizarProyecto", () => {
  test("finaliza el proyecto", async () => {
    // Preparación
    const { _id } = await crearProyecto();

    // Ejecución
    const actualizado = await proyectoService.actualizarProyecto(_id, { finalizado: true });

    // Validación
    expect(actualizado.finalizado).toBe(true);
    expect((await ProyectoModel.findById(_id).lean()).finalizado).toBe(true);
  });

  test("no permite finalizar dos veces", async () => {
    // Preparación
    const { _id } = await crearProyecto();
    await proyectoService.actualizarProyecto(_id, { finalizado: true });

    // Ejecución + Validación
    await esperarAppError(
      proyectoService.actualizarProyecto(_id, { finalizado: true }),
      ErrorCatalog.PROYECTO_FINALIZADO,
      400,
    );
  });

  test("no permite des-finalizar (finalizado: false)", async () => {
    // Preparación
    const { _id } = await crearProyecto();

    // Ejecución + Validación
    await esperarAppError(
      proyectoService.actualizarProyecto(_id, { finalizado: false }),
      ErrorCatalog.ARGUMENTO_INVALIDO,
      400,
    );
  });

  test("actualiza y borra la urlDonaciones", async () => {
    // Preparación
    const { _id } = await crearProyecto();

    // Ejecución
    const conUrl = await proyectoService.actualizarProyecto(_id, {
      urlDonaciones: "https://mercadopago.com/huerta",
    });
    const sinUrl = await proyectoService.actualizarProyecto(_id, { urlDonaciones: null });

    // Validación
    expect(conUrl.urlDonaciones).toBe("https://mercadopago.com/huerta");
    expect(sinUrl.urlDonaciones).toBeNull();
  });

  test("rechaza una urlDonaciones inválida o que no es texto", async () => {
    // Preparación
    const { _id } = await crearProyecto();

    // Ejecución + Validación
    await esperarAppError(
      proyectoService.actualizarProyecto(_id, { urlDonaciones: "no es url" }),
      ErrorCatalog.PROYECTO_URL_DONACIONES_INVALIDA,
      400,
    );
    await esperarAppError(
      proyectoService.actualizarProyecto(_id, { urlDonaciones: 123 }),
      ErrorCatalog.PROYECTO_URL_DONACIONES_INVALIDA,
      400,
    );
  });

  test("actualiza la fechaCierre", async () => {
    // Preparación
    const { _id } = await crearProyecto();
    const fecha = new Date(Date.now() + UNA_HORA);

    // Ejecución
    const actualizado = await proyectoService.actualizarProyecto(_id, {
      fechaCierre: fecha.toISOString(),
    });

    // Validación
    expect(actualizado.fechaCierre).toEqual(fecha);
  });

  test("rechaza cambios vacíos o con campos no permitidos", async () => {
    // Preparación
    const { _id } = await crearProyecto();

    // Ejecución + Validación
    await esperarAppError(
      proyectoService.actualizarProyecto(_id, {}),
      ErrorCatalog.ARGUMENTO_INVALIDO,
      400,
    );
    await esperarAppError(
      proyectoService.actualizarProyecto(_id, { titulo: "Otro" }),
      ErrorCatalog.ARGUMENTO_INVALIDO,
      400,
    );
    await esperarAppError(
      proyectoService.actualizarProyecto(_id, [1]),
      ErrorCatalog.ARGUMENTO_INVALIDO,
      400,
    );
    expect((await ProyectoModel.findById(_id).lean()).titulo).toBe("Huerta digital");
  });

  test("falla si el proyecto no existe", async () => {
    // Ejecución + Validación
    await esperarAppError(
      proyectoService.actualizarProyecto(new mongoose.Types.ObjectId().toString(), {
        finalizado: true,
      }),
      ErrorCatalog.PROYECTO_NO_ENCONTRADO,
      404,
    );
  });
});

describe("ProyectoService.obtenerEstadisticas", () => {
  test("sin proyectos devuelve ceros", async () => {
    expect(await proyectoService.obtenerEstadisticas()).toEqual({
      total: 0,
      activos: 0,
      finalizados: 0,
    });
  });

  test("cuenta activos y finalizados", async () => {
    // Preparación
    await crearProyecto({ titulo: "A" });
    await crearProyecto({ titulo: "B" });
    const c = await crearProyecto({ titulo: "C" });
    await proyectoService.finalizarProyecto(c._id);

    // Ejecución + Validación
    expect(await proyectoService.obtenerEstadisticas()).toEqual({
      total: 3,
      activos: 2,
      finalizados: 1,
    });
  });
});
