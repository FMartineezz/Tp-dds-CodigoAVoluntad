import request from "supertest";
import { app } from "../int/utils/app.js";
import { usarBaseDeDatos } from "../utils/db.js";
import { limpiar, sembrar, idFijo } from "../../seeds/sembrar.js";
import * as datos from "../../seeds/datos.js";
import { generarVolumen, conVolumen, CANTIDADES_POR_DEFECTO } from "../../seeds/volumen.js";

import { ColectivoModel } from "../../src/schemas/colectivoSchema.js";
import { PersonaColaboradoraModel } from "../../src/schemas/personaColaboradoraSchema.js";
import { ProyectoModel } from "../../src/schemas/proyectoSchema.js";
import { ColaboracionModel } from "../../src/schemas/colaboracionSchema.js";
import { PostulacionModel } from "../../src/schemas/postulacionSchema.js";
import ErrorCatalog from "../../src/errors/errorCatalog.js";
import { EstadoPostulacion } from "../../src/models/postulacion.js";
import { ValoracionModel } from "../../src/schemas/valoracionSchema.js";
import { MensajeModel } from "../../src/schemas/mensajeSchema.js";

usarBaseDeDatos();

// El seed carga directo con los modelos; estos tests leen el resultado a través de la API real,
// así si un cambio en el dominio deja al seed desactualizado, se rompe acá y no en la demo.

const colectivo = (nombre) => ColectivoModel.findOne({ nombre });
const colaboradora = (nombreFantasia) => PersonaColaboradoraModel.findOne({ nombreFantasia });
const proyecto = (titulo) => ProyectoModel.findOne({ titulo });

describe("Seed", () => {
  test("carga todas las entidades y devuelve las cantidades", async () => {
    // Ejecución
    const cantidades = await sembrar();

    // Validación
    expect(cantidades).toEqual({
      habilidades: datos.habilidades.length,
      colectivos: datos.colectivos.length,
      colaboradoras: datos.colaboradoras.length,
      proyectos: datos.proyectos.length,
      postulaciones: datos.postulaciones.length,
      colaboraciones: datos.postulaciones.filter((p) => p.estado === EstadoPostulacion.ACEPTADA)
        .length,
      valoraciones: datos.valoraciones.length,
      denuncias: datos.denuncias.length,
      mensajes: datos.mensajes.length,
      notificaciones: datos.notificaciones.length,
      colectivosDadosDeBaja: datos.colectivos.filter((c) => c.eliminado).length,
      colaboradorasEliminadas: datos.colaboradoras.filter((c) => c.eliminada).length,
    });
  });

  test("colectivos y colaboradoras tienen ids fijos, iguales al resembrar", async () => {
    // Preparación: el front usa estos ids como cuentas de demo
    await sembrar();
    await limpiar();

    // Ejecución
    await sembrar();

    // Validación
    const colectivo = await request(app).get(`/colectivos/${idFijo("c", 1)}`);
    const colaboradora = await request(app).get(`/colaboradoras/${idFijo("a", 5)}`);
    expect(idFijo("c", 1)).toBe("c00000000000000000000001");
    expect(colectivo.body.nombre).toBe(datos.colectivos[0].nombre);
    expect(colaboradora.body.nombreFantasia).toBe(datos.colaboradoras[4].nombreFantasia);
  });

  test("se puede correr dos veces seguidas y deja el mismo resultado", async () => {
    // Preparación
    const primera = await sembrar();

    // Ejecución
    await limpiar();
    const segunda = await sembrar();

    // Validación
    expect(segunda).toEqual(primera);
    expect(await ProyectoModel.countDocuments()).toBe(datos.proyectos.length);
  });

  describe("los datos sembrados se leen bien desde la API", () => {
    beforeEach(() => sembrar());

    test("GET de las entidades principales responde con datos", async () => {
      for (const [ruta, cantidad] of [
        ["/habilidades", datos.habilidades.length],
        // Los colectivos dados de baja no se listan
        ["/colectivos", datos.colectivos.filter((c) => !c.eliminado).length],
        ["/colaboradoras", datos.colaboradoras.length],
        ["/proyectos", datos.proyectos.length],
      ]) {
        const respuesta = await request(app).get(ruta);
        expect(respuesta.status).toBe(200);
        expect(respuesta.body.total ?? respuesta.body.length).toBe(cantidad);
      }
    });

    test("cada proyecto expone sus perfiles con cupo y su avance", async () => {
      // Preparación
      const donaciones = await proyecto("Plataforma de Donaciones Comunitarias");

      // Ejecución
      const respuesta = await request(app).get(`/proyectos/${donaciones._id}`);

      // Validación
      expect(respuesta.status).toBe(200);
      expect(respuesta.body.perfiles.map((p) => p.cantidadMaxima)).toEqual([2, 1]);
      expect(respuesta.body.urlDonaciones).toBe("https://cafecito.app/colectivoambiental");
      expect(new Date(respuesta.body.fechaLimiteBusqueda).getTime()).toBeGreaterThan(Date.now());
      expect(respuesta.body.logros).toHaveLength(2);
    });

    test("el colectivo ve sus postulaciones pendientes", async () => {
      // Preparación
      const ambiental = await colectivo("Colectivo Ambiental CABA");

      // Ejecución
      const respuesta = await request(app).get(
        `/colectivos/${ambiental._id}/postulaciones?estado=pendiente`,
      );

      // Validación
      expect(respuesta.status).toBe(200);
      expect(respuesta.body).toHaveLength(1);
    });

    test("una postulación pendiente se puede aceptar y queda dentro del cupo", async () => {
      // Preparación: FullstackFer está pendiente en frontend (cupo 2, ocupado por DevNeko)
      const ambiental = await colectivo("Colectivo Ambiental CABA");
      const pendientes = await request(app).get(
        `/colectivos/${ambiental._id}/postulaciones?estado=pendiente`,
      );
      const postulacionId = pendientes.body[0].id ?? pendientes.body[0]._id;

      // Ejecución
      const respuesta = await request(app)
        .patch(`/postulaciones/${postulacionId}`)
        .send({ estado: EstadoPostulacion.ACEPTADA });

      // Validación
      expect(respuesta.status).toBe(200);
      const fer = await colaboradora("FullstackFer");
      expect(
        await ColaboracionModel.countDocuments({ personaColaboradora: fer._id, activo: true }),
      ).toBe(1);
    });

    test("no se puede aceptar a nadie más en un perfil que ya llenó su cupo", async () => {
      // Preparación: backend de Donaciones tiene cupo 1 y ya lo ocupa BackendBeto.
      // Se borra la postulación rechazada de FullstackFer para que pueda volver a postularse.
      const donaciones = await proyecto("Plataforma de Donaciones Comunitarias");
      const backend = donaciones.perfiles.find((p) => p.descripcion === "Desarrollo backend");
      const fer = await colaboradora("FullstackFer");
      await PostulacionModel.deleteMany({ personaColaboradora: fer._id, perfil: backend._id });
      const postulacion = await request(app)
        .post(`/proyectos/${donaciones._id}/perfiles/${backend._id}/postulaciones`)
        .send({ personaColaboradoraId: String(fer._id) });
      expect(postulacion.status).toBe(201);

      // Ejecución
      const respuesta = await request(app)
        .patch(`/postulaciones/${postulacion.body.id ?? postulacion.body._id}`)
        .send({ estado: EstadoPostulacion.ACEPTADA });

      // Validación
      expect(respuesta.status).toBe(409);
      expect(respuesta.body.code).toBe(ErrorCatalog.COLABORACION_CUPO_COMPLETO.code);
    });

    test("los proyectos con búsqueda cerrada o finalizados no reciben postulaciones", async () => {
      for (const titulo of ["Sistema de Turnos del Comedor", "Sitio de la Asamblea"]) {
        // Preparación
        const proy = await proyecto(titulo);
        const perfil = proy.perfiles[0];
        const devNeko = await colaboradora("DevNeko");
        const fer = await colaboradora("FullstackFer");

        // Ejecución
        const respuesta = await request(app)
          .post(`/proyectos/${proy._id}/perfiles/${perfil._id}/postulaciones`)
          .send({
            personaColaboradoraId: String(titulo.includes("Comedor") ? fer._id : devNeko._id),
          });

        // Validación
        expect(respuesta.status).toBe(409);
      }
    });

    test("las búsquedas por habilidades encuentran coincidencias", async () => {
      // Preparación
      const dataSol = await colaboradora("DataSol");
      const huertas = await proyecto("Mapa de Huertas Urbanas");
      const tester = huertas.perfiles.find((p) => p.descripcion === "Tester");

      // Ejecución
      const proyectos = await request(app).get(`/colaboradoras/${dataSol._id}/proyectos-acordes`);
      const colaboradoras = await request(app).get(
        `/proyectos/${huertas._id}/perfiles/${tester._id}/colaboradoras-acordes`,
      );

      // Validación
      expect(proyectos.status).toBe(200);
      expect(proyectos.body.resultados.map((p) => p.titulo)).toContain("Mapa de Huertas Urbanas");
      expect(colaboradoras.status).toBe(200);
      expect(colaboradoras.body.resultados.map((c) => c.nombreFantasia)).toContain("QA Tincho");
    });

    test("hay mensajes en ambas direcciones y notificaciones para las dos partes", async () => {
      // Preparación
      const devNeko = await colaboradora("DevNeko");
      const ambiental = await colectivo("Colectivo Ambiental CABA");
      const dataSol = await colaboradora("DataSol");

      // Ejecución
      const mensajes = await request(app).get(`/colaboradoras/${devNeko._id}/mensajes`);
      const notifPersona = await request(app).get(`/colaboradoras/${dataSol._id}/notificaciones`);
      const notifColectivo = await request(app).get(`/colectivos/${ambiental._id}/notificaciones`);

      // Validación
      expect(mensajes.status).toBe(200);
      expect(new Set(mensajes.body.map((m) => m.emisor))).toEqual(
        new Set(["colectivo", "persona"]),
      );
      expect(notifPersona.status).toBe(200);
      expect(notifPersona.body).toHaveLength(1);
      expect(notifColectivo.status).toBe(200);
      expect(notifColectivo.body).toHaveLength(1);
    });

    test("hay colaboraciones dadas de baja por cada parte", async () => {
      const bajas = await ColaboracionModel.find({ activo: false });
      expect(bajas.map((c) => c.bajaPor).sort()).toEqual(["colectivo", "persona"]);
      bajas.forEach((c) => expect(c.fechaBaja).toBeInstanceOf(Date));
    });

    test("las valoraciones y la denuncia se ven desde la API", async () => {
      // Preparación
      const devNeko = await colaboradora("DevNeko");
      const asamblea = await colectivo("Asamblea Abierta por los Espacios Verdes");

      // Ejecución
      const deLaPersona = await request(app).get(
        `/personaColaboradora/${devNeko._id}/valoraciones`,
      );
      const delColectivo = await request(app).get(`/colectivo/${asamblea._id}/valoraciones`);
      const denuncias = await request(app).get("/admin/denuncias");

      // Validación
      expect(deLaPersona.status).toBe(200);
      expect(deLaPersona.body).not.toHaveLength(0);
      expect(delColectivo.status).toBe(200);
      expect(delColectivo.body).not.toHaveLength(0);
      expect(denuncias.status).toBe(200);
      expect(denuncias.body).toHaveLength(datos.denuncias.length);
    });

    test("las estadísticas reflejan los datos sembrados", async () => {
      const respuesta = await request(app)
        .get("/estadisticas")
        .set("x-api-key", process.env.MI_API_KEY);

      expect(respuesta.status).toBe(200);
      expect(respuesta.body).toHaveProperty("estadisticasColaboraciones");
      expect(respuesta.body).toHaveProperty("estadisticasProyectos");
    });
  });

  // Lo que el front necesita poder mostrar: cada estado tiene que aparecer al menos una vez.
  async function verificarQueCubreTodosLosEstados() {
    const ahora = new Date();
    const proyectos = await ProyectoModel.find().lean();
    const existe = (condicion, descripcion) =>
      expect({ [descripcion]: proyectos.some(condicion) }).toEqual({ [descripcion]: true });

    existe(
      (p) => !p.finalizado && !p.busquedaCerrada && !p.fechaLimiteBusqueda,
      "abierto sin fecha",
    );
    existe((p) => !p.finalizado && p.fechaLimiteBusqueda > ahora, "abierto hasta una fecha");
    existe((p) => !p.finalizado && p.fechaLimiteBusqueda < ahora, "fecha límite vencida");
    existe((p) => !p.finalizado && p.busquedaCerrada, "búsqueda cerrada");
    existe((p) => p.finalizado && !p.fechaCierre, "finalizado a mano");
    existe((p) => p.finalizado && p.fechaCierre < ahora, "finalizado por cierre automático");
    existe((p) => !p.finalizado && p.fechaCierre > ahora, "con cierre automático programado");
    existe((p) => p.urlDonaciones, "con link de donaciones");
    existe((p) => !p.urlDonaciones, "sin link de donaciones");
    existe((p) => p.logros.length === 0, "sin logros");
    existe((p) => p.logros.reduce((t, l) => t + l.porcentaje, 0) === 100, "logros al 100%");

    const perfiles = proyectos.flatMap((p) => p.perfiles);
    expect(perfiles.some((p) => p.cantidadMaxima == null)).toBe(true);
    const ocupados = async (perfil) =>
      ColaboracionModel.countDocuments({ perfil: perfil._id, activo: true });
    const conCupo = perfiles.filter((p) => p.cantidadMaxima != null);
    const estadosDeCupo = await Promise.all(
      conCupo.map(async (p) => ((await ocupados(p)) >= p.cantidadMaxima ? "lleno" : "libre")),
    );
    expect(new Set(estadosDeCupo)).toEqual(new Set(["lleno", "libre"]));

    expect(new Set(await PostulacionModel.distinct("estado"))).toEqual(
      new Set(Object.values(EstadoPostulacion)),
    );
    expect(await PostulacionModel.exists({ anonima: true })).not.toBeNull();
    expect(new Set(await ColaboracionModel.distinct("bajaPor"))).toEqual(
      new Set(["persona", "colectivo"]),
    );
    expect(await ColaboracionModel.exists({ activo: true })).not.toBeNull();
    expect(new Set(await ValoracionModel.distinct("evaluador"))).toEqual(
      new Set(["persona", "colectivo"]),
    );
    expect(new Set(await MensajeModel.distinct("leido"))).toEqual(new Set([true, false]));
    expect(new Set(await MensajeModel.distinct("emisor"))).toEqual(
      new Set(["persona", "colectivo"]),
    );

    const colectivos = await ColectivoModel.find().select("+activo +denuncias").lean();
    expect(colectivos.some((c) => c.activo === false)).toBe(true);
    expect(colectivos.some((c) => c.proyectos.length === 0)).toBe(true);
    const estadosDenuncia = new Set(colectivos.flatMap((c) => c.denuncias.map((d) => d.estado)));
    expect(estadosDenuncia).toEqual(
      new Set(["pendiente", "en_revision", "resuelta", "descartada"]),
    );

    const personas = await PersonaColaboradoraModel.find().select("+activo +contactos").lean();
    expect(personas.some((p) => p.activo === false && p.nombreFantasia === "UserEliminado")).toBe(
      true,
    );
    expect(personas.some((p) => p.bloquearMensajeInterno)).toBe(true);
    expect(personas.some((p) => p.activo !== false && p.contactos.length === 0)).toBe(true);
  }

  describe("modo demo", () => {
    test("cubre todos los estados que el front necesita mostrar", async () => {
      await sembrar();
      await verificarQueCubreTodosLosEstados();
    });

    test("las cuentas dadas de baja conservan su historial", async () => {
      // Preparación
      await sembrar();
      const huellas = await ColectivoModel.findOne({ nombre: "Fundación Huellas" }).select(
        "+activo",
      );
      const adopciones = await proyecto("App de Adopciones");

      // Ejecución
      const listado = await request(app).get("/colectivos");
      const proyectoDelColectivo = await request(app).get(`/proyectos/${adopciones._id}`);
      const colaboraciones = await ColaboracionModel.find({ proyecto: adopciones._id });
      const anonimizada = await PersonaColaboradoraModel.findById(
        colaboraciones[0].personaColaboradora,
      ).select("+activo +contactos");

      // Validación
      expect(huellas.activo).toBe(false);
      expect(listado.body.resultados.map((c) => c.nombre)).not.toContain("Fundación Huellas");
      expect(proyectoDelColectivo.status).toBe(200);
      expect(anonimizada.nombreFantasia).toBe("UserEliminado");
      expect(anonimizada.contactos).toHaveLength(0);
      expect(await ValoracionModel.countDocuments({ colaboracion: colaboraciones[0]._id })).toBe(2);
    });
  });

  describe("modo volumen", () => {
    test("es determinista: la misma semilla genera exactamente los mismos datos", () => {
      const primera = generarVolumen(datos.habilidades, { semilla: 7 });
      const segunda = generarVolumen(datos.habilidades, { semilla: 7 });
      const otra = generarVolumen(datos.habilidades, { semilla: 8 });

      expect(segunda).toEqual(primera);
      expect(otra).not.toEqual(primera);
    });

    test("respeta las cantidades pedidas", () => {
      const generado = generarVolumen(datos.habilidades, {
        colectivos: 5,
        colaboradoras: 12,
        proyectos: 7,
      });

      expect(generado.colectivos).toHaveLength(5);
      expect(generado.colaboradoras).toHaveLength(12);
      expect(generado.proyectos).toHaveLength(7);
    });

    // Varias semillas: los datos generados tienen que pasar siempre las validaciones del seed
    test.each([1, 2, 3, 2026])("con la semilla %i siembra sin romper reglas", async (semilla) => {
      const cantidades = await sembrar(conVolumen(datos, { semilla }));

      expect(cantidades.proyectos).toBe(datos.proyectos.length + CANTIDADES_POR_DEFECTO.proyectos);
      expect(cantidades.colaboradoras).toBe(
        datos.colaboradoras.length + CANTIDADES_POR_DEFECTO.colaboradoras,
      );
      expect(cantidades.postulaciones).toBeGreaterThan(100);
    });

    test("alcanza para paginar y sigue cubriendo todos los estados", async () => {
      // Preparación
      await sembrar(conVolumen(datos));

      // Ejecución
      const proyectos = await request(app).get("/proyectos");
      const colaboradoras = await request(app).get("/colaboradoras");
      const colectivos = await request(app).get("/colectivos");

      // Validación: más de 3 páginas de 20 en cada listado
      expect(proyectos.body.total).toBeGreaterThan(60);
      expect(colaboradoras.body.total).toBeGreaterThan(60);
      expect(colectivos.body.total).toBeGreaterThan(30);
      await verificarQueCubreTodosLosEstados();
    });
  });

  describe("verifica las reglas del dominio antes de guardar", () => {
    const conCambios = (cambios) => ({ ...datos, ...cambios });

    test("falla si una postulación aceptada supera el cupo del perfil", async () => {
      const postulaciones = [
        ...datos.postulaciones,
        {
          colaboradora: "FullstackFer",
          proyecto: "Plataforma de Donaciones Comunitarias",
          perfil: "Desarrollo backend",
          estado: EstadoPostulacion.ACEPTADA,
        },
      ];
      await expect(sembrar(conCambios({ postulaciones }))).rejects.toThrow(/cupo/);
    });

    test("falla si la colaboradora no tiene ninguna habilidad requerida del perfil", async () => {
      const postulaciones = [
        {
          colaboradora: "DataSol",
          proyecto: "Plataforma de Donaciones Comunitarias",
          perfil: "Desarrollo backend",
          estado: EstadoPostulacion.PENDIENTE,
        },
      ];
      await expect(sembrar(conCambios({ postulaciones }))).rejects.toThrow(/habilidad requerida/);
    });

    test("falla si una postulación queda pendiente con la búsqueda cerrada", async () => {
      const postulaciones = [
        {
          colaboradora: "BackendBeto",
          proyecto: "Sistema de Turnos del Comedor",
          perfil: "Backend de turnos",
          estado: EstadoPostulacion.PENDIENTE,
        },
      ];
      await expect(sembrar(conCambios({ postulaciones }))).rejects.toThrow(/búsqueda cerrada/);
    });

    test("falla si se referencia una habilidad que no existe", async () => {
      const colaboradoras = [{ ...datos.colaboradoras[0], habilidades: ["cobol"] }];
      await expect(sembrar(conCambios({ colaboradoras }))).rejects.toThrow(/cobol/);
    });
  });
});
