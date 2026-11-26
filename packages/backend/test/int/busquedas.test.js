import request from "supertest";
import mongoose from "mongoose";
import { app } from "./utils/app.js";
import { conToken } from "../utils/tokenDeTest.js";
import { usarBaseDeDatos } from "../utils/db.js";
import ErrorCatalog from "../../src/errors/errorCatalog.js";
import { ProyectoModel } from "../../src/schemas/proyectoSchema.js";

usarBaseDeDatos();

const idInexistente = () => new mongoose.Types.ObjectId().toString();

const perfil = (habilidadesRequeridas, habilidadesOpcionales = []) => ({
  descripcion: "Perfil",
  habilidadesRequeridas,
  habilidadesOpcionales,
  horas: 10,
  tipoDeCompromiso: "semanal",
  modalidadDeColaboracion: "gratuita",
});

const crearProyecto = async (titulo, perfiles) => {
  const respuesta = await request(app).post("/proyectos").send({
    titulo,
    descripcion: "Descripción",
    perfiles,
    colectivo: "Asamblea Norte",
    urlSistema: "https://sistema.org",
  });
  expect(respuesta.status).toBe(201);
  return respuesta.body;
};

const crearColaboradora = async (nombreFantasia, habilidades) => {
  const respuesta = await request(app)
    .post("/colaboradoras").set(conToken())
    .send({
      nombreFantasia,
      git: `github:${nombreFantasia}`,
      habilidades,
      presentacion: "Presentación",
      contactos: [{ tipo: "email", valor: `${nombreFantasia}@mail.com` }],
    });
  expect(respuesta.status).toBe(201);
  return respuesta.body;
};

describe("Búsquedas (HTTP)", () => {
  beforeEach(async () => {
    for (const titulo of ["Node", "React", "Python"]) {
      await request(app).post("/habilidades").send({ titulo, descripcion: "d" });
    }
    await request(app).post("/colectivos").set(conToken()).send({
      nombre: "Asamblea Norte",
      descripcion: "Asamblea",
      ubicacion: "caba",
      tipoDeColectivo: "asamblea",
    });
  });

  describe("GET /proyectos/:idProyecto/perfiles/:idPerfil/colaboradoras-acordes", () => {
    test("devuelve las colaboradoras con alguna habilidad requerida, sin contactos", async () => {
      // Preparación
      const proyecto = await crearProyecto("Web", [perfil(["node", "react"], ["python"])]);
      await crearColaboradora("ada", ["node"]);
      await crearColaboradora("dan", ["react"]);
      await crearColaboradora("guido", ["python"]);
      const perfilId = proyecto.perfiles[0]._id;

      // Ejecución
      const respuesta = await request(app).get(
        `/proyectos/${proyecto._id}/perfiles/${perfilId}/colaboradoras-acordes`,
      );

      // Validación
      expect(respuesta.status).toBe(200);
      expect(respuesta.body.resultados.map((c) => c.nombreFantasia).sort()).toEqual(["ada", "dan"]);
      respuesta.body.resultados.forEach((colaboradora) =>
        expect(colaboradora).not.toHaveProperty("contactos"),
      );
    });

    test("responde 404 si el proyecto no existe", async () => {
      // Ejecución
      const respuesta = await request(app).get(
        `/proyectos/${idInexistente()}/perfiles/${idInexistente()}/colaboradoras-acordes`,
      );

      // Validación
      expect(respuesta.status).toBe(404);
      expect(respuesta.body.code).toBe(ErrorCatalog.PROYECTO_NO_ENCONTRADO.code);
    });

    test("responde 404 si el perfil no existe en el proyecto", async () => {
      // Preparación
      const proyecto = await crearProyecto("Web", [perfil(["node"])]);

      // Ejecución
      const respuesta = await request(app).get(
        `/proyectos/${proyecto._id}/perfiles/${idInexistente()}/colaboradoras-acordes`,
      );

      // Validación
      expect(respuesta.status).toBe(404);
      expect(respuesta.body.code).toBe(ErrorCatalog.PERFIL_NO_ENCONTRADO.code);
    });
  });

  describe("GET /colaboradoras/:id/proyectos-acordes", () => {
    test("devuelve los proyectos activos que requieren sus habilidades", async () => {
      // Preparación
      await crearProyecto("Backend", [perfil(["node"])]);
      await crearProyecto("Datos", [perfil(["python"])]);
      const finalizado = await crearProyecto("Viejo", [perfil(["node"])]);
      await request(app).patch(`/proyectos/${finalizado._id}`).send({ finalizado: true });
      await crearProyecto("Front", [perfil(["react"], ["node"])]);
      const colaboradora = await crearColaboradora("ada", ["node"]);

      // Ejecución
      const respuesta = await request(app).get(
        `/colaboradoras/${colaboradora.id}/proyectos-acordes`,
      );

      // Validación
      expect(respuesta.status).toBe(200);
      expect(respuesta.body.resultados.map((p) => p.titulo)).toEqual(["Backend"]);
      expect(respuesta.body.resultados[0].colectivo).toMatchObject({ nombre: "Asamblea Norte" });
    });

    test("no incluye proyectos con la búsqueda cerrada o la fecha límite vencida", async () => {
      // Preparación
      await crearProyecto("Abierto", [perfil(["node"])]);
      const cerrado = await crearProyecto("Cerrado", [perfil(["node"])]);
      const vencido = await crearProyecto("Vencido", [perfil(["node"])]);
      await ProyectoModel.updateOne({ _id: cerrado._id }, { busquedaCerrada: true });
      await ProyectoModel.updateOne(
        { _id: vencido._id },
        { fechaLimiteBusqueda: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      );
      const colaboradora = await crearColaboradora("eva", ["node"]);

      // Ejecución
      const respuesta = await request(app).get(
        `/colaboradoras/${colaboradora.id}/proyectos-acordes`,
      );

      // Validación
      expect(respuesta.body.resultados.map((p) => p.titulo)).toEqual(["Abierto"]);
    });

    test("devuelve una lista vacía si no hay proyectos acordes", async () => {
      // Preparación
      await crearProyecto("Backend", [perfil(["node"])]);
      const colaboradora = await crearColaboradora("dan", ["react"]);

      // Ejecución
      const respuesta = await request(app).get(
        `/colaboradoras/${colaboradora.id}/proyectos-acordes`,
      );

      // Validación
      expect(respuesta.status).toBe(200);
      expect(respuesta.body.resultados).toEqual([]);
    });

    test("responde 404 si la colaboradora no existe", async () => {
      // Ejecución
      const respuesta = await request(app).get(
        `/colaboradoras/${idInexistente()}/proyectos-acordes`,
      );

      // Validación
      expect(respuesta.status).toBe(404);
      expect(respuesta.body.code).toBe(ErrorCatalog.COLABORADORA_NO_ENCONTRADA.code);
    });
  });
});
