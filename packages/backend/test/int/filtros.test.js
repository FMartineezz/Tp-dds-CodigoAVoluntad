import request from "supertest";
import { app } from "./utils/app.js";
import { usarBaseDeDatos } from "../utils/db.js";
import { sembrar } from "../../seeds/sembrar.js";
import * as datos from "../../seeds/datos.js";
import ErrorCatalog from "../../src/errors/errorCatalog.js";

usarBaseDeDatos();

// Los datos curados del seed: chicos y conocidos, así se puede decir qué tiene que volver
beforeEach(() => sembrar(datos));

// Pide la lista entera (un límite alto) con los filtros dados y devuelve el cuerpo
async function listar(ruta, filtros = "") {
  const respuesta = await request(app).get(`${ruta}?limite=100&${filtros}`);
  expect(respuesta.status).toBe(200);
  return respuesta.body;
}

const titulos = (cuerpo) => cuerpo.resultados.map((proyecto) => proyecto.titulo);

describe("GET /proyectos con filtros", () => {
  test("por estado: abierto, en curso y finalizado se reparten todos los proyectos", async () => {
    // Ejecución
    const todos = await listar("/proyectos");
    const abiertos = await listar("/proyectos", "estado=abierto");
    const enCurso = await listar("/proyectos", "estado=en_curso");
    const finalizados = await listar("/proyectos", "estado=finalizado");

    // Validación
    expect(abiertos.total + enCurso.total + finalizados.total).toBe(todos.total);
    expect(titulos(finalizados)).toEqual(
      expect.arrayContaining(["Sitio de la Asamblea", "App de Adopciones"]),
    );
    // Búsqueda cerrada a mano y fecha límite vencida cuentan como «en curso»
    expect(titulos(enCurso)).toEqual(
      expect.arrayContaining(["Sistema de Turnos del Comedor", "Huerta Escolar Digital"]),
    );
    expect(finalizados.resultados.every((proyecto) => proyecto.finalizado)).toBe(true);
  });

  test("por modalidad: vuelven los que tienen algún perfil con esa modalidad", async () => {
    // Ejecución
    const cuerpo = await listar("/proyectos", "modalidad=contratacion_eventual");

    // Validación
    expect(cuerpo.total).toBeGreaterThan(0);
    for (const proyecto of cuerpo.resultados) {
      const modalidades = proyecto.perfiles.map((perfil) => perfil.modalidadDeColaboracion);
      expect(modalidades).toContain("contratacion_eventual");
    }
  });

  test("por habilidad: cuenta si es requerida u opcional en algún perfil", async () => {
    // Ejecución
    const cuerpo = await listar("/proyectos", "habilidad=uso_de_soap_ui");

    // Validación: en el seed solo la pide (como opcional) el Mapa de Huertas
    expect(titulos(cuerpo)).toEqual(["Mapa de Huertas Urbanas"]);
  });

  test("por búsqueda: busca en título y descripción sin importar mayúsculas", async () => {
    // Ejecución
    const cuerpo = await listar("/proyectos", "busqueda=HUERTA");

    // Validación
    expect(cuerpo.total).toBeGreaterThan(0);
    for (const proyecto of cuerpo.resultados) {
      expect(`${proyecto.titulo} ${proyecto.descripcion}`.toLowerCase()).toContain("huerta");
    }
  });

  test("la búsqueda toma los caracteres especiales tal cual (no como regex)", async () => {
    // Ejecución
    const cuerpo = await listar("/proyectos", "busqueda=.*");

    // Validación
    expect(cuerpo.total).toBe(0);
  });

  test("los filtros se combinan y el total respeta la paginación", async () => {
    // Preparación
    const combinados = await listar("/proyectos", "estado=abierto&modalidad=gratuita");

    // Ejecución
    const primeraPagina = await request(app).get(
      "/proyectos?estado=abierto&modalidad=gratuita&limite=2",
    );

    // Validación
    expect(primeraPagina.status).toBe(200);
    expect(primeraPagina.body.total).toBe(combinados.total);
    expect(primeraPagina.body.totalPaginas).toBe(Math.ceil(combinados.total / 2));
    expect(primeraPagina.body.resultados).toHaveLength(Math.min(2, combinados.total));
  });

  test("un filtro vacío (?estado=) se ignora", async () => {
    // Ejecución
    const todos = await listar("/proyectos");
    const conVacio = await listar("/proyectos", "estado=&busqueda=");

    // Validación
    expect(conVacio.total).toBe(todos.total);
  });

  test.each([
    ["estado=terminado", ErrorCatalog.FILTRO_ESTADO_PROYECTO_INVALIDO.code],
    ["modalidad=paga", ErrorCatalog.FILTRO_MODALIDAD_INVALIDA.code],
    ["habilidad=a&habilidad=b", ErrorCatalog.FILTRO_HABILIDAD_INVALIDA.code],
    [`busqueda=${"x".repeat(101)}`, ErrorCatalog.FILTRO_BUSQUEDA_INVALIDA.code],
    ["habilidad=no_existe", ErrorCatalog.HABILIDADES_INEXISTENTES_GENERICO.code],
  ])("responde 400 con ?%s", async (filtro, codigo) => {
    // Ejecución
    const respuesta = await request(app).get(`/proyectos?${filtro}`);

    // Validación
    expect(respuesta.status).toBe(400);
    expect(respuesta.body.code).toBe(codigo);
  });
});

describe("GET /colaboradoras con filtros", () => {
  const alias = (cuerpo) => cuerpo.resultados.map((persona) => persona.nombreFantasia);

  test("por búsqueda: nombre, apellido o nombre de fantasía", async () => {
    // Ejecución
    const porFantasia = await listar("/colaboradoras", "busqueda=neko");

    // Validación
    expect(alias(porFantasia)).toEqual(["DevNeko"]);
  });

  test("por habilidad: solo quienes la tienen", async () => {
    // Ejecución
    const cuerpo = await listar("/colaboradoras", "habilidad=desarrollo_web_react");

    // Validación
    expect(cuerpo.total).toBeGreaterThan(0);
    expect(alias(cuerpo)).toContain("FullstackFer");
  });

  test("por aceptaMensajes: true y false se reparten a todas las personas", async () => {
    // Ejecución
    const todas = await listar("/colaboradoras");
    const aceptan = await listar("/colaboradoras", "aceptaMensajes=true");
    const bloquean = await listar("/colaboradoras", "aceptaMensajes=false");

    // Validación
    expect(aceptan.total + bloquean.total).toBe(todas.total);
    expect(bloquean.total).toBeGreaterThan(0);
  });

  test.each([
    ["aceptaMensajes=si", ErrorCatalog.FILTRO_ACEPTA_MENSAJES_INVALIDO.code],
    ["habilidad=no_existe", ErrorCatalog.HABILIDADES_INEXISTENTES_GENERICO.code],
  ])("responde 400 con ?%s", async (filtro, codigo) => {
    // Ejecución
    const respuesta = await request(app).get(`/colaboradoras?${filtro}`);

    // Validación
    expect(respuesta.status).toBe(400);
    expect(respuesta.body.code).toBe(codigo);
  });
});
