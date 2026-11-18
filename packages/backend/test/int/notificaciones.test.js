import request from "supertest";
import { app } from "./utils/app.js";
import { usarBaseDeDatos } from "../utils/db.js";
import {
  crearColectivo,
  crearHabilidad,
  esperarHasta,
  idInexistente,
  pausa,
} from "../utils/escenarios.js";
import { notificacionAutomaticaService } from "../../src/container.js";
import ErrorCatalog from "../../src/errors/errorCatalog.js";

usarBaseDeDatos();

beforeAll(() => notificacionAutomaticaService.iniciar());

const esperarListeners = () => pausa(200);

const crearColaboradoraHttp = (habilidades) =>
  request(app)
    .post("/colaboradoras")
    .send({
      nombreFantasia: `Colaboradora ${Math.random().toString(36).slice(2, 8)}`,
      nombre: "Ana",
      git: "github.com/ana",
      habilidades,
      presentacion: "Hola",
    });

const crearProyectoHttp = (colectivo, habilidades) =>
  request(app)
    .post("/proyectos")
    .send({
      titulo: `Proyecto ${Math.random().toString(36).slice(2, 8)}`,
      descripcion: "Descripción",
      colectivo: colectivo.nombre,
      urlSistema: "https://sistema.test",
      perfiles: [
        {
          descripcion: "Perfil",
          habilidadesRequeridas: habilidades,
          habilidadesOpcionales: [],
          horas: 10,
          tipoDeCompromiso: "semanal",
          modalidadDeColaboracion: "gratuita",
        },
      ],
    });

describe("Notificaciones (HTTP)", () => {
  test("GET /colaboradoras/:id/notificaciones devuelve los proyectos publicados acordes", async () => {
    // Preparación
    const habilidad = await crearHabilidad();
    const colectivo = await crearColectivo();
    const { body: persona } = await crearColaboradoraHttp([habilidad.codigo]);
    await esperarListeners();

    // Ejecución
    const { body: proyecto, status } = await crearProyectoHttp(colectivo, [habilidad.codigo]);
    const respuesta = await esperarHasta(async () => {
      const r = await request(app).get(`/colaboradoras/${persona.id}/notificaciones`);
      return r.body.length > 0 ? r : null;
    });
    await esperarListeners();

    // Validación
    expect(status).toBe(201);
    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toHaveLength(1);
    expect(respuesta.body[0].destinatario).toBe("persona");
    expect(respuesta.body[0].proyecto.titulo).toBe(proyecto.titulo);
  });

  test("GET /colectivos/:id/notificaciones avisa de colaboradoras nuevas acordes", async () => {
    // Preparación
    const habilidad = await crearHabilidad();
    const colectivo = await crearColectivo();
    await crearProyectoHttp(colectivo, [habilidad.codigo]);
    await esperarListeners();

    // Ejecución
    const { body: persona, status } = await crearColaboradoraHttp([habilidad.codigo]);
    const respuesta = await esperarHasta(async () => {
      const r = await request(app).get(`/colectivos/${colectivo.id}/notificaciones`);
      return r.body.length > 0 ? r : null;
    });
    await esperarListeners();

    // Validación
    expect(status).toBe(201);
    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toHaveLength(1);
    expect(respuesta.body[0].destinatario).toBe("colectivo");
    expect(respuesta.body[0].personaColaboradora.nombreFantasia).toBe(persona.nombreFantasia);
  });

  test("sin coincidencias las listas quedan vacías", async () => {
    const h1 = await crearHabilidad();
    const h2 = await crearHabilidad();
    const colectivo = await crearColectivo();
    const { body: persona } = await crearColaboradoraHttp([h1.codigo]);
    await esperarListeners();
    await crearProyectoHttp(colectivo, [h2.codigo]);
    await esperarListeners();

    const dePersona = await request(app).get(`/colaboradoras/${persona.id}/notificaciones`);
    const delColectivo = await request(app).get(`/colectivos/${colectivo.id}/notificaciones`);

    expect(dePersona.status).toBe(200);
    expect(dePersona.body).toEqual([]);
    expect(delColectivo.status).toBe(200);
    expect(delColectivo.body).toEqual([]);
  });

  test("responden 404 si la colaboradora o el colectivo no existen", async () => {
    const persona = await request(app).get(`/colaboradoras/${idInexistente()}/notificaciones`);
    const colectivo = await request(app).get(`/colectivos/${idInexistente()}/notificaciones`);

    expect(persona.status).toBe(404);
    expect(persona.body.code).toBe(ErrorCatalog.COLABORADORA_NO_ENCONTRADA.code);
    expect(colectivo.status).toBe(404);
    expect(colectivo.body.code).toBe(ErrorCatalog.COLECTIVO_NO_ENCONTRADO.code);
  });
});
