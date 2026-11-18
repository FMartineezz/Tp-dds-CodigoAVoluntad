import mongoose from "mongoose";
import { usarBaseDeDatos } from "../utils/db.js";
import { esperarAppError } from "../utils/esperarAppError.js";
import {
  perfilService,
  proyectoService,
  habilidadService,
  colectivoService,
} from "../../src/container.js";
import ErrorCatalog from "../../src/errors/errorCatalog.js";
import { Perfil } from "../../src/models/perfil.js";
import { ProyectoModel } from "../../src/schemas/proyectoSchema.js";

usarBaseDeDatos();

const nuevoId = () => new mongoose.Types.ObjectId().toString();

let backend;
let frontend;
let testing;
let proyecto;
let perfil;

beforeEach(async () => {
  await habilidadService.crearHabilidad("Backend", "APIs y bases de datos");
  await habilidadService.crearHabilidad("Frontend", "Interfaces web");
  await habilidadService.crearHabilidad("Testing", "Pruebas automatizadas");
  backend = await habilidadService.obtenerHabilidadPorCodigo("backend");
  frontend = await habilidadService.obtenerHabilidadPorCodigo("frontend");
  testing = await habilidadService.obtenerHabilidadPorCodigo("testing");
  await colectivoService.crearColectivo("Huerta Comunitaria", "Huerta del barrio", "caba", "ong");

  const creado = await proyectoService.crearProyecto(
    "Huerta digital",
    "Sistema para organizar la huerta",
    [
      {
        descripcion: "Desarrollo backend",
        habilidadesRequeridas: ["backend"],
        habilidadesOpcionales: ["frontend"],
        horas: 10,
        tipoDeCompromiso: "semanal",
        modalidadDeColaboracion: "gratuita",
        cantidadMaxima: 2,
      },
    ],
    "Huerta Comunitaria",
    "https://huerta.org",
  );
  proyecto = await proyectoService.obtenerProyectoPorId(creado._id);
  perfil = proyecto.perfiles[0];
});

const ids = (lista) => lista.map(String);

describe("PerfilService.crearPerfil", () => {
  test("arma el perfil con las habilidades encontradas, respetando requeridas y opcionales", async () => {
    // Ejecución
    const nuevo = await perfilService.crearPerfil(
      "Fullstack",
      ["backend", "frontend"],
      ["testing"],
      20,
      "mensual",
      "incentivo_economico",
      4,
    );

    // Validación
    expect(nuevo).toBeInstanceOf(Perfil);
    expect(nuevo).toMatchObject({
      descripcion: "Fullstack",
      horas: 20,
      tipoDeCompromiso: "mensual",
      modalidadDeColaboracion: "incentivo_economico",
      cantidadMaxima: 4,
    });
    expect(nuevo.habilidadesRequeridas.map((h) => h.codigo)).toEqual(["backend", "frontend"]);
    expect(nuevo.habilidadesOpcionales.map((h) => h.codigo)).toEqual(["testing"]);
  });

  test("falla listando los códigos que no existen", async () => {
    // Ejecución
    const promesa = perfilService.crearPerfil(
      "X",
      ["backend", "cobol"],
      ["fortran"],
      1,
      "total",
      "gratuita",
    );

    // Validación
    await esperarAppError(promesa, ErrorCatalog.HABILIDADES_INEXISTENTES_GENERICO, 400);
    await expect(promesa).rejects.toThrow(/cobol, fortran/);
  });
});

describe("PerfilService.prepararCambios", () => {
  test("sin habilidades devuelve los cambios tal cual (no agrega listas vacías)", async () => {
    // Ejecución
    const cambios = await perfilService.prepararCambios({ descripcion: "Nueva", horas: 3 });

    // Validación
    expect(cambios).toEqual({ descripcion: "Nueva", horas: 3 });
  });

  test("resuelve solo las listas de habilidades que vienen", async () => {
    // Ejecución
    const cambios = await perfilService.prepararCambios({ habilidadesOpcionales: ["testing"] });

    // Validación
    expect(cambios.habilidadesRequeridas).toBeUndefined();
    expect(cambios.habilidadesOpcionales.map((h) => h.codigo)).toEqual(["testing"]);
  });

  test("falla si alguna habilidad no existe", async () => {
    await esperarAppError(
      perfilService.prepararCambios({ habilidadesRequeridas: ["cobol"] }),
      ErrorCatalog.HABILIDADES_INEXISTENTES_GENERICO,
      400,
    );
  });
});

describe("Perfiles de un proyecto (ProyectoService + PerfilService)", () => {
  test("agregarPerfil guarda un perfil nuevo en el proyecto", async () => {
    // Ejecución
    const agregado = await proyectoService.agregarPerfil(
      proyecto._id,
      "Testing",
      ["testing"],
      [],
      5,
      "total",
      "contratacion_eventual",
      1,
    );

    // Validación
    expect(agregado._id).toBeDefined();
    const perfiles = await proyectoService.obtenerPerfiles(proyecto._id);
    expect(perfiles).toHaveLength(2);
    const guardado = perfiles.find((p) => String(p._id) === String(agregado._id));
    expect(guardado).toMatchObject({
      descripcion: "Testing",
      horas: 5,
      tipoDeCompromiso: "total",
      modalidadDeColaboracion: "contratacion_eventual",
      cantidadMaxima: 1,
    });
    expect(ids(guardado.habilidadesRequeridas)).toEqual([String(testing._id)]);
  });

  test("agregarPerfil falla si alguna habilidad no existe y no modifica el proyecto", async () => {
    // Ejecución + Validación
    await esperarAppError(
      proyectoService.agregarPerfil(proyecto._id, "X", ["cobol"], [], 5, "total", "gratuita"),
      ErrorCatalog.HABILIDADES_INEXISTENTES_GENERICO,
      400,
    );
    expect(await proyectoService.obtenerPerfiles(proyecto._id)).toHaveLength(1);
  });

  // BUG: agregarPerfil no verifica que el proyecto exista: el repositorio devuelve null y el
  // service lo retorna como si hubiera creado el perfil (por HTTP, un 201 con body null).
  test.failing("agregarPerfil falla con 404 si el proyecto no existe", async () => {
    await esperarAppError(
      proyectoService.agregarPerfil(nuevoId(), "X", ["backend"], [], 5, "total", "gratuita"),
      ErrorCatalog.PROYECTO_NO_ENCONTRADO,
      404,
    );
  });

  test("obtenerPerfilPorId devuelve el perfil", async () => {
    // Ejecución
    const encontrado = await proyectoService.obtenerPerfilPorId(proyecto._id, perfil._id);

    // Validación
    expect(encontrado.descripcion).toBe("Desarrollo backend");
  });

  test("obtenerPerfilPorId falla si el perfil o el proyecto no existen", async () => {
    await esperarAppError(
      proyectoService.obtenerPerfilPorId(proyecto._id, nuevoId()),
      ErrorCatalog.PERFIL_NO_ENCONTRADO,
      404,
    );
    await esperarAppError(
      proyectoService.obtenerPerfilPorId(nuevoId(), perfil._id),
      ErrorCatalog.PROYECTO_NO_ENCONTRADO,
      404,
    );
  });

  test("obtenerPerfiles falla si el proyecto no existe", async () => {
    await esperarAppError(
      proyectoService.obtenerPerfiles(nuevoId()),
      ErrorCatalog.PROYECTO_NO_ENCONTRADO,
      404,
    );
  });

  test("editar un perfil sin tocar habilidades no las borra", async () => {
    // Ejecución
    const editado = await proyectoService.actualizarPerfil(proyecto._id, perfil._id, {
      descripcion: "Backend senior",
      horas: 15,
    });

    // Validación
    expect(editado).toMatchObject({ descripcion: "Backend senior", horas: 15 });
    const guardado = await proyectoService.obtenerPerfilPorId(proyecto._id, perfil._id);
    expect(ids(guardado.habilidadesRequeridas)).toEqual([String(backend._id)]);
    expect(ids(guardado.habilidadesOpcionales)).toEqual([String(frontend._id)]);
  });

  test("editar solo las opcionales mantiene las requeridas", async () => {
    // Ejecución
    await proyectoService.actualizarPerfil(proyecto._id, perfil._id, {
      habilidadesOpcionales: ["testing"],
    });

    // Validación
    const guardado = await proyectoService.obtenerPerfilPorId(proyecto._id, perfil._id);
    expect(ids(guardado.habilidadesRequeridas)).toEqual([String(backend._id)]);
    expect(ids(guardado.habilidadesOpcionales)).toEqual([String(testing._id)]);
  });

  test("editar las requeridas las reemplaza", async () => {
    // Ejecución
    await proyectoService.actualizarPerfil(proyecto._id, perfil._id, {
      habilidadesRequeridas: ["testing", "frontend"],
    });

    // Validación
    const guardado = await proyectoService.obtenerPerfilPorId(proyecto._id, perfil._id);
    expect(ids(guardado.habilidadesRequeridas)).toEqual([
      String(testing._id),
      String(frontend._id),
    ]);
  });

  test("editar con una habilidad inexistente falla y no cambia el perfil", async () => {
    // Ejecución + Validación
    await esperarAppError(
      proyectoService.actualizarPerfil(proyecto._id, perfil._id, {
        descripcion: "Otra",
        habilidadesRequeridas: ["cobol"],
      }),
      ErrorCatalog.HABILIDADES_INEXISTENTES_GENERICO,
      400,
    );
    const guardado = await proyectoService.obtenerPerfilPorId(proyecto._id, perfil._id);
    expect(guardado.descripcion).toBe("Desarrollo backend");
  });

  // BUG: ProyectoRepository.actualizarPerfil no incluye "cantidadMaxima" entre los campos
  // permitidos, así que el cupo de un perfil no se puede editar (se ignora en silencio).
  test.failing("editar la cantidadMaxima del perfil la actualiza", async () => {
    // Ejecución
    await proyectoService.actualizarPerfil(proyecto._id, perfil._id, { cantidadMaxima: 5 });

    // Validación
    const guardado = await proyectoService.obtenerPerfilPorId(proyecto._id, perfil._id);
    expect(guardado.cantidadMaxima).toBe(5);
  });

  test("editar falla si el perfil no existe", async () => {
    await esperarAppError(
      proyectoService.actualizarPerfil(proyecto._id, nuevoId(), { descripcion: "X" }),
      ErrorCatalog.PERFIL_NO_ENCONTRADO,
      404,
    );
  });

  test("eliminarPerfil quita el perfil del proyecto y lo devuelve", async () => {
    // Preparación
    const otro = await proyectoService.agregarPerfil(
      proyecto._id,
      "Testing",
      ["testing"],
      [],
      5,
      "total",
      "gratuita",
    );

    // Ejecución
    const eliminado = await proyectoService.eliminarPerfil(proyecto._id, perfil._id);

    // Validación
    expect(String(eliminado._id)).toBe(String(perfil._id));
    const guardado = await ProyectoModel.findById(proyecto._id).lean();
    expect(ids(guardado.perfiles.map((p) => p._id))).toEqual([String(otro._id)]);
    await esperarAppError(
      proyectoService.obtenerPerfilPorId(proyecto._id, perfil._id),
      ErrorCatalog.PERFIL_NO_ENCONTRADO,
      404,
    );
  });

  test("eliminarPerfil falla si el perfil no existe", async () => {
    await esperarAppError(
      proyectoService.eliminarPerfil(proyecto._id, nuevoId()),
      ErrorCatalog.PERFIL_NO_ENCONTRADO,
      404,
    );
  });
});
