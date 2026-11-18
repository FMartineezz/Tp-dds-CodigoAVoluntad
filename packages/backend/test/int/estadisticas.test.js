import { setTimeout as dormir } from "node:timers/promises";
import request from "supertest";
import { app } from "./utils/app.js";
import { usarBaseDeDatos } from "../utils/db.js";
import {
  habilidadService,
  colectivoService,
  personaColaboradoraService,
  proyectoService,
  postulacionService,
  colaboracionService,
} from "../../src/container.js";
import { EstadoPostulacion } from "../../src/models/postulacion.js";
import { PostulacionModel } from "../../src/schemas/postulacionSchema.js";

usarBaseDeDatos();

const API_KEY = process.env.MI_API_KEY;

// Las consultas de estadísticas mandan la API key para no consumir el cupo del rate limit,
// que se prueba aparte al final del archivo.
const getEstadisticas = () => request(app).get("/estadisticas").set("x-api-key", API_KEY);

async function crearPersona(nombre, habilidades, bloquearMensajeInterno) {
  return await personaColaboradoraService.crearPersonaColaboradora(
    nombre,
    `https://github.com/${nombre.toLowerCase()}`,
    nombre,
    "Pérez",
    habilidades,
    [],
    "Hola",
    [{ tipo: "email", valor: `${nombre.toLowerCase()}@mail.com` }],
    bloquearMensajeInterno,
  );
}

async function crearProyecto(titulo) {
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
  );
  const proyecto = await proyectoService.obtenerProyectoPorId(creado._id);
  return { id: String(proyecto._id), perfilId: String(proyecto.perfiles[0]._id) };
}

describe("GET /estadisticas", () => {
  test("sin datos devuelve todo en cero", async () => {
    // Ejecución
    const respuesta = await getEstadisticas();

    // Validación
    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({
      estadisticasColaboraciones: { total: 0, anonimas: 0, publicas: 0 },
      estadisticasColectivos: { total: 0, porUbicacion: [] },
      estadisticasProyectos: {
        proyectos: { total: 0, activos: 0, finalizados: 0 },
        postulacionesPorProyecto: [],
      },
      estadisticasPersonasColaboradoras: {
        total: 0,
        bloqueanMensajes: 0,
        promedioHabilidadesPorPersona: 0,
        promedioPostulacionesPorPersona: 0,
      },
    });
  });

  test("agrega los datos reales de la base", async () => {
    // Preparación
    await habilidadService.crearHabilidad("Backend", "APIs y bases de datos");
    await habilidadService.crearHabilidad("Frontend", "Interfaces web");
    await colectivoService.crearColectivo("Huerta Comunitaria", "Huerta", "caba", "ong");
    await colectivoService.crearColectivo("Comedor", "Comedor", "caba", "asamblea");
    await colectivoService.crearColectivo("Biblioteca", "Biblioteca", "cordoba", "fundacion");

    const ana = await crearPersona("Ana", ["backend", "frontend"], true);
    const beto = await crearPersona("Beto", ["backend"], false);

    const huerta = await crearProyecto("Huerta digital");
    const comedor = await crearProyecto("Comedor online");

    const anaEnHuerta = await postulacionService.crearPostulacion(
      huerta.id,
      huerta.perfilId,
      String(ana.id),
      true,
    );
    await postulacionService.crearPostulacion(huerta.id, huerta.perfilId, String(beto.id));
    const anaEnComedor = await postulacionService.crearPostulacion(
      comedor.id,
      comedor.perfilId,
      String(ana.id),
    );

    // Aceptar crea una colaboración anónima; se suma una colaboración pública directa
    await postulacionService.actualizarEstado(anaEnHuerta.id, EstadoPostulacion.ACEPTADA);
    await colaboracionService.crearColaboracion(String(beto.id), huerta.id, huerta.perfilId, false);

    // Cerrar el comedor rechaza la postulación pendiente de Ana (vía evento asíncrono)
    await proyectoService.finalizarProyecto(comedor.id);
    const limite = Date.now() + 3000;
    while ((await PostulacionModel.findById(anaEnComedor.id).lean()).estado !== "rechazada") {
      if (Date.now() > limite) throw new Error("La postulación no se rechazó a tiempo");
      await dormir(25);
    }

    // Ejecución
    const respuesta = await getEstadisticas();

    // Validación
    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({
      estadisticasColaboraciones: { total: 2, anonimas: 1, publicas: 1 },
      estadisticasColectivos: {
        total: 3,
        porUbicacion: [
          { ubicacion: "caba", cantidad: 2 },
          { ubicacion: "cordoba", cantidad: 1 },
        ],
      },
      estadisticasProyectos: {
        proyectos: { total: 2, activos: 1, finalizados: 1 },
        postulacionesPorProyecto: [
          {
            proyecto: "Huerta digital",
            cantidadPostulaciones: 2,
            cantidadPostulacionesAceptadas: 1,
            cantidadPostulacionesPendientes: 1,
            cantidadPostulacionesRechazadas: 0,
          },
          {
            proyecto: "Comedor online",
            cantidadPostulaciones: 1,
            cantidadPostulacionesAceptadas: 0,
            cantidadPostulacionesPendientes: 0,
            cantidadPostulacionesRechazadas: 1,
          },
        ],
      },
      estadisticasPersonasColaboradoras: {
        total: 2,
        bloqueanMensajes: 1,
        promedioHabilidadesPorPersona: 1.5,
        promedioPostulacionesPorPersona: 1.5,
      },
    });
  });
});

// Va al final: el contador del rate limit vive en memoria (por IP) durante todo el archivo.
describe("Rate limit de /estadisticas", () => {
  test("con la x-api-key correcta no limita", async () => {
    // Ejecución
    const respuestas = [];
    for (let i = 0; i < 8; i++) {
      respuestas.push(await getEstadisticas());
    }

    // Validación
    expect(respuestas.map((r) => r.status)).toEqual(Array(8).fill(200));
  });

  test("sin API key (o con una incorrecta) responde 429 al superar 5 pedidos", async () => {
    // Ejecución
    const permitidas = [];
    for (let i = 0; i < 5; i++) {
      const pedido = request(app).get("/estadisticas");
      permitidas.push(await (i % 2 === 0 ? pedido : pedido.set("x-api-key", "clave-incorrecta")));
    }
    const bloqueada = await request(app).get("/estadisticas");

    // Validación
    expect(permitidas.map((r) => r.status)).toEqual([200, 200, 200, 200, 200]);
    expect(bloqueada.status).toBe(429);
    expect(bloqueada.body).toEqual({
      status: 429,
      message: "Demasiadas peticiones desde esta Ip. Intente de nuevo mas tarde",
    });

    // Con la clave correcta (por header o query) se sigue respondiendo aunque la IP esté limitada
    expect((await getEstadisticas()).status).toBe(200);
    expect((await request(app).get(`/estadisticas?apiKey=${API_KEY}`)).status).toBe(200);
    expect((await request(app).get("/estadisticas")).status).toBe(429);
  });

  // BUG: el skip compara `apiKey == process.env.MI_API_KEY`. Si MI_API_KEY no está configurada,
  // un pedido sin clave da `undefined == undefined` → true y el rate limit no se aplica a nadie.
  test.failing("sin MI_API_KEY configurada igual limita los pedidos sin clave", async () => {
    // Preparación
    const original = process.env.MI_API_KEY;
    delete process.env.MI_API_KEY;

    try {
      // Ejecución
      const estados = [];
      for (let i = 0; i < 6; i++) {
        estados.push((await request(app).get("/estadisticas")).status);
      }

      // Validación
      expect(estados.at(-1)).toBe(429);
    } finally {
      process.env.MI_API_KEY = original;
    }
  });
});
