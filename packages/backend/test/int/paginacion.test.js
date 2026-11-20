import request from "supertest";
import { app } from "./utils/app.js";
import { usarBaseDeDatos } from "../utils/db.js";
import { sembrar } from "../../seeds/sembrar.js";
import * as datos from "../../seeds/datos.js";
import { conVolumen } from "../../seeds/volumen.js";
import ErrorCatalog from "../../src/errors/errorCatalog.js";
import { LIMITE_MAXIMO, LIMITE_POR_DEFECTO } from "../../src/utils/paginacion.js";

import { ProyectoModel } from "../../src/schemas/proyectoSchema.js";
import { ColectivoModel } from "../../src/schemas/colectivoSchema.js";
import { PersonaColaboradoraModel } from "../../src/schemas/personaColaboradoraSchema.js";

usarBaseDeDatos();

// Datos reales del seed en modo volumen, achicado para que cada test siembre rápido
beforeEach(() =>
  sembrar(conVolumen(datos, { semilla: 3, colectivos: 15, colaboradoras: 45, proyectos: 30 })),
);

const LISTADOS = [
  ["/proyectos", () => ProyectoModel.countDocuments()],
  ["/colaboradoras", () => PersonaColaboradoraModel.countDocuments()],
  // Los colectivos dados de baja no se listan
  ["/colectivos", () => ColectivoModel.countDocuments({ activo: true })],
];

const idDe = (documento) => String(documento._id ?? documento.id);

describe.each(LISTADOS)("GET %s paginado", (ruta, contarEnLaBase) => {
  test("sin parámetros devuelve la primera página con el límite por defecto", async () => {
    // Preparación
    const total = await contarEnLaBase();

    // Ejecución
    const respuesta = await request(app).get(ruta);

    // Validación
    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toMatchObject({
      pagina: 1,
      limite: LIMITE_POR_DEFECTO,
      total,
      totalPaginas: Math.ceil(total / LIMITE_POR_DEFECTO),
    });
    expect(respuesta.body.resultados).toHaveLength(Math.min(total, LIMITE_POR_DEFECTO));
  });

  test("recorriendo todas las páginas se ve cada elemento una sola vez", async () => {
    // Preparación
    const limite = 7;
    const primera = await request(app).get(`${ruta}?limite=${limite}`);
    const { total, totalPaginas } = primera.body;

    // Ejecución
    const ids = [];
    for (let pagina = 1; pagina <= totalPaginas; pagina++) {
      const respuesta = await request(app).get(`${ruta}?pagina=${pagina}&limite=${limite}`);
      expect(respuesta.status).toBe(200);
      expect(respuesta.body.pagina).toBe(pagina);
      const esperados = pagina < totalPaginas ? limite : total - limite * (totalPaginas - 1);
      expect(respuesta.body.resultados).toHaveLength(esperados);
      ids.push(...respuesta.body.resultados.map(idDe));
    }

    // Validación
    expect(totalPaginas).toBeGreaterThan(2);
    expect(ids).toHaveLength(total);
    expect(new Set(ids).size).toBe(total);
  });

  test("ordena del más nuevo al más viejo", async () => {
    const respuesta = await request(app).get(`${ruta}?limite=${LIMITE_MAXIMO}`);

    const ids = respuesta.body.resultados.map(idDe);
    expect(ids).toEqual([...ids].sort().reverse());
  });

  test("una página posterior a la última viene vacía, con el total", async () => {
    // Preparación
    const total = await contarEnLaBase();

    // Ejecución
    const respuesta = await request(app).get(`${ruta}?pagina=999&limite=10`);

    // Validación
    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toMatchObject({ resultados: [], pagina: 999, total });
  });

  test(`acepta el límite máximo (${LIMITE_MAXIMO})`, async () => {
    const respuesta = await request(app).get(`${ruta}?limite=${LIMITE_MAXIMO}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.limite).toBe(LIMITE_MAXIMO);
  });
});

describe("GET /proyectos", () => {
  test("cada proyecto trae el id y el nombre de su colectivo", async () => {
    const respuesta = await request(app).get("/proyectos?limite=5");

    respuesta.body.resultados.forEach((proyecto) => {
      expect(proyecto.colectivo).toEqual({ _id: expect.any(String), nombre: expect.any(String) });
    });
  });
});

describe("GET /colectivos/:colectivoId/proyectos", () => {
  test("pagina solo los proyectos de ese colectivo", async () => {
    // Preparación: el Colectivo Ambiental CABA del seed
    const colectivo = await ColectivoModel.findOne({ nombre: "Colectivo Ambiental CABA" });
    const total = await ProyectoModel.countDocuments({ colectivo: colectivo._id });

    // Ejecución
    const respuesta = await request(app).get(`/colectivos/${colectivo._id}/proyectos?limite=2`);

    // Validación
    expect(total).toBeGreaterThan(0);
    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toMatchObject({ pagina: 1, limite: 2, total });
    respuesta.body.resultados.forEach((p) =>
      expect(p.colectivo).toEqual({ _id: String(colectivo._id), nombre: colectivo.nombre }),
    );
  });

  test("responde 404 si el colectivo no existe", async () => {
    const respuesta = await request(app).get("/colectivos/000000000000000000000000/proyectos");

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.code).toBe(ErrorCatalog.COLECTIVO_NO_ENCONTRADO.code);
  });

  test("responde 404 si el id no tiene formato de ObjectId", async () => {
    const respuesta = await request(app).get("/colectivos/1/proyectos");

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.code).toBe(ErrorCatalog.COLECTIVO_NO_ENCONTRADO.code);
  });
});

describe("parámetros de paginación inválidos", () => {
  test.each([
    ["pagina=0", ErrorCatalog.PAGINACION_PAGINA_INVALIDA],
    ["pagina=-2", ErrorCatalog.PAGINACION_PAGINA_INVALIDA],
    ["pagina=1.5", ErrorCatalog.PAGINACION_PAGINA_INVALIDA],
    ["pagina=abc", ErrorCatalog.PAGINACION_PAGINA_INVALIDA],
    ["limite=0", ErrorCatalog.PAGINACION_LIMITE_INVALIDO],
    [`limite=${LIMITE_MAXIMO + 1}`, ErrorCatalog.PAGINACION_LIMITE_INVALIDO],
    ["limite=diez", ErrorCatalog.PAGINACION_LIMITE_INVALIDO],
  ])("?%s responde 400", async (query, error) => {
    for (const [ruta] of LISTADOS) {
      const respuesta = await request(app).get(`${ruta}?${query}`);

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe(error.code);
    }
  });

  test("el mensaje del límite inválido indica el máximo", async () => {
    const respuesta = await request(app).get("/proyectos?limite=500");

    expect(respuesta.body.message).toContain(String(LIMITE_MAXIMO));
  });
});

describe("búsquedas paginadas", () => {
  test("GET /proyectos/:id/perfiles/:id/colaboradoras-acordes pagina las coincidencias", async () => {
    // Preparación: el perfil de testing del Mapa de Huertas
    const proyecto = await ProyectoModel.findOne({ titulo: "Mapa de Huertas Urbanas" });
    const perfil = proyecto.perfiles.find((p) => p.descripcion === "Tester");
    const total = await PersonaColaboradoraModel.countDocuments({
      habilidades: { $in: perfil.habilidadesRequeridas },
    });
    const ruta = `/proyectos/${proyecto._id}/perfiles/${perfil._id}/colaboradoras-acordes`;

    // Ejecución
    const primera = await request(app).get(`${ruta}?limite=3`);
    const segunda = await request(app).get(`${ruta}?pagina=2&limite=3`);

    // Validación
    expect(total).toBeGreaterThan(3);
    expect(primera.body).toMatchObject({ pagina: 1, limite: 3, total });
    expect(primera.body.resultados).toHaveLength(3);
    const idsPrimera = primera.body.resultados.map(idDe);
    segunda.body.resultados.forEach((c) => expect(idsPrimera).not.toContain(idDe(c)));
  });

  test("GET /colaboradoras/:id/proyectos-acordes pagina los que todavía buscan gente", async () => {
    // Preparación: FullstackFer tiene JS, Node, React y Postman
    const fer = await PersonaColaboradoraModel.findOne({ nombreFantasia: "FullstackFer" });
    const total = await ProyectoModel.countDocuments({
      finalizado: { $ne: true },
      busquedaCerrada: { $ne: true },
      $or: [{ fechaLimiteBusqueda: null }, { fechaLimiteBusqueda: { $gt: new Date() } }],
      "perfiles.habilidadesRequeridas": { $in: fer.habilidades },
    });

    // Ejecución
    const respuesta = await request(app).get(
      `/colaboradoras/${fer._id}/proyectos-acordes?limite=4`,
    );

    // Validación
    expect(total).toBeGreaterThan(4);
    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toMatchObject({ pagina: 1, limite: 4, total });
    expect(respuesta.body.resultados).toHaveLength(4);
    respuesta.body.resultados.forEach((p) => {
      expect(p.finalizado).toBe(false);
      expect(p.busquedaCerrada).toBe(false);
    });
  });

  test("las búsquedas también validan los parámetros", async () => {
    const fer = await PersonaColaboradoraModel.findOne({ nombreFantasia: "FullstackFer" });

    const respuesta = await request(app).get(
      `/colaboradoras/${fer._id}/proyectos-acordes?pagina=0`,
    );

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.code).toBe(ErrorCatalog.PAGINACION_PAGINA_INVALIDA.code);
  });
});
