import request from "supertest";
import { app } from "./utils/app.js";
import { usarBaseDeDatos } from "../utils/db.js";
import {
  armarEscenario,
  crearColaboracion,
  idInexistente,
  sembrarDenuncia,
} from "../utils/escenarios.js";
import ErrorCatalog from "../../src/errors/errorCatalog.js";

usarBaseDeDatos();

const denunciar = (colaboracionId, body = { descripcion: "Trato inadecuado" }) =>
  request(app).post(`/colaboraciones/${colaboracionId}/denuncia`).send(body);

describe("Denuncias (HTTP)", () => {
  describe("POST /colaboraciones/:id/denuncia", () => {
    test("responde 201 con la denuncia pendiente y el Location administrativo", async () => {
      // Preparación
      const e = await armarEscenario();
      const { colaboracionId } = await crearColaboracion(e);

      // Ejecución
      const respuesta = await denunciar(colaboracionId);

      // Validación
      expect(respuesta.status).toBe(201);
      expect(respuesta.body).toMatchObject({
        descripcion: "Trato inadecuado",
        estado: "pendiente",
        colaboracionId,
      });
      expect(respuesta.headers.location).toBe(`/admin/denuncias/${respuesta.body.id}`);
    });

    test("responde 409 si la colaboración ya fue denunciada", async () => {
      const e = await armarEscenario();
      const { colaboracionId } = await crearColaboracion(e);
      await sembrarDenuncia(e.colectivoId, colaboracionId);

      const respuesta = await denunciar(colaboracionId);

      expect(respuesta.status).toBe(409);
      expect(respuesta.body.code).toBe(ErrorCatalog.DENUNCIA_DUPLICADA.code);
    });

    test("responde 400 si falta la descripción o está vacía", async () => {
      const e = await armarEscenario();
      const { colaboracionId } = await crearColaboracion(e);

      const sinDescripcion = await denunciar(colaboracionId, {});
      const vacia = await denunciar(colaboracionId, { descripcion: "   " });

      expect(sinDescripcion.status).toBe(400);
      expect(sinDescripcion.body.code).toBe(ErrorCatalog.DENUNCIA_DESCRIPCION_REQUERIDA.code);
      expect(vacia.status).toBe(400);
      expect(vacia.body.code).toBe(ErrorCatalog.DENUNCIA_DESCRIPCION_REQUERIDA.code);
    });

    test("responde 404 si la colaboración no existe", async () => {
      const respuesta = await denunciar(idInexistente());

      expect(respuesta.status).toBe(404);
      expect(respuesta.body.code).toBe(ErrorCatalog.COLABORACION_NO_ENCONTRADA.code);
    });
  });

  describe("rutas administrativas", () => {
    test("GET /admin/denuncias lista y filtra por estado", async () => {
      // Preparación
      const e = await armarEscenario();
      const { colaboracionId } = await crearColaboracion(e);
      const denunciaId = await sembrarDenuncia(e.colectivoId, colaboracionId);

      // Ejecución
      const todas = await request(app).get("/admin/denuncias");
      const pendientes = await request(app).get("/admin/denuncias?estado=pendiente");
      const resueltas = await request(app).get("/admin/denuncias?estado=resuelta");

      // Validación
      expect(todas.status).toBe(200);
      expect(todas.body).toHaveLength(1);
      expect(todas.body[0]).toMatchObject({
        _id: denunciaId,
        colectivoId: e.colectivoId,
        colectivoNombre: e.colectivo.nombre,
        colaboracionId,
      });
      expect(pendientes.body).toHaveLength(1);
      expect(resueltas.body).toHaveLength(0);
    });

    // BUG: el query param colectivoId llega al service pero el repositorio lo ignora,
    // así que devuelve las denuncias de todos los colectivos.
    test.failing("GET /admin/denuncias?colectivoId filtra por colectivo", async () => {
      const e1 = await armarEscenario();
      const e2 = await armarEscenario();
      await sembrarDenuncia(e1.colectivoId, (await crearColaboracion(e1)).colaboracionId);
      await sembrarDenuncia(e2.colectivoId, (await crearColaboracion(e2)).colaboracionId);

      const respuesta = await request(app).get(`/admin/denuncias?colectivoId=${e1.colectivoId}`);

      expect(respuesta.status).toBe(200);
      expect(respuesta.body).toHaveLength(1);
      expect(respuesta.body[0].colectivoId).toBe(e1.colectivoId);
    });

    test("GET /admin/denuncias/:id devuelve el detalle con la colaboración", async () => {
      const e = await armarEscenario();
      const { colaboracionId } = await crearColaboracion(e);
      const denunciaId = await sembrarDenuncia(e.colectivoId, colaboracionId, {
        descripcion: "Trato inadecuado",
      });

      const respuesta = await request(app).get(`/admin/denuncias/${denunciaId}`);

      expect(respuesta.status).toBe(200);
      expect(respuesta.body.descripcion).toBe("Trato inadecuado");
      expect(respuesta.body.colaboracion._id).toBe(colaboracionId);
    });

    test("GET /admin/denuncias/:id responde 404 si no existe", async () => {
      const respuesta = await request(app).get(`/admin/denuncias/${idInexistente()}`);

      expect(respuesta.status).toBe(404);
      expect(respuesta.body.code).toBe(ErrorCatalog.DENUNCIA_NO_ENCONTRADA.code);
    });

    test("PATCH /admin/denuncias/:id/estado cambia el estado", async () => {
      const e = await armarEscenario();
      const { colaboracionId } = await crearColaboracion(e);
      const denunciaId = await sembrarDenuncia(e.colectivoId, colaboracionId);

      const respuesta = await request(app)
        .patch(`/admin/denuncias/${denunciaId}/estado`)
        .send({ estado: "Descartada" });

      expect(respuesta.status).toBe(200);
      expect(respuesta.body.estado).toBe("descartada");
    });

    test("PATCH /admin/denuncias/:id/estado valida el estado", async () => {
      const e = await armarEscenario();
      const { colaboracionId } = await crearColaboracion(e);
      const denunciaId = await sembrarDenuncia(e.colectivoId, colaboracionId);

      const sinEstado = await request(app).patch(`/admin/denuncias/${denunciaId}/estado`).send({});
      const invalido = await request(app)
        .patch(`/admin/denuncias/${denunciaId}/estado`)
        .send({ estado: "pendiente" });

      expect(sinEstado.status).toBe(400);
      expect(sinEstado.body.code).toBe(ErrorCatalog.DENUNCIA_ESTADO_REQUERIDO.code);
      expect(invalido.status).toBe(400);
      expect(invalido.body.code).toBe(ErrorCatalog.DENUNCIA_ESTADO_INVALIDO.code);
    });

    test("PATCH /admin/denuncias/:id/estado responde 404 si no existe", async () => {
      const respuesta = await request(app)
        .patch(`/admin/denuncias/${idInexistente()}/estado`)
        .send({ estado: "resuelta" });

      expect(respuesta.status).toBe(404);
      expect(respuesta.body.code).toBe(ErrorCatalog.DENUNCIA_NO_ENCONTRADA.code);
    });
  });
});
