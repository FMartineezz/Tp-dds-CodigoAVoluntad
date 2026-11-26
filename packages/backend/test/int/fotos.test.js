import request from "supertest";
import { app } from "./utils/app.js";
import { usarBaseDeDatos } from "../utils/db.js";
import { crearColaboradora, crearColectivo, crearHabilidad, idInexistente } from "../utils/escenarios.js";
import ErrorCatalog from "../../src/errors/errorCatalog.js";

usarBaseDeDatos();

// Unos bytes cualquiera hacen de imagen: el backend guarda y devuelve lo que recibe
const IMAGEN = Buffer.from("una imagen de prueba");

const subir = (ruta, id, cuerpo = IMAGEN, tipo = "image/jpeg") =>
  request(app).put(`/${ruta}/${id}/foto`).set("Content-Type", tipo).send(cuerpo);

// Lo mismo vale para colectivos y para colaboradoras
const RECURSOS = [
  { ruta: "colectivos", crear: crearColectivo, noEncontrado: ErrorCatalog.COLECTIVO_NO_ENCONTRADO },
  {
    ruta: "colaboradoras",
    // Una colaboradora tiene que tener al menos una habilidad
    crear: async () => crearColaboradora({ habilidades: [(await crearHabilidad()).codigo] }),
    noEncontrado: ErrorCatalog.COLABORADORA_NO_ENCONTRADA,
  },
];

describe.each(RECURSOS)("Foto de perfil de $ruta", ({ ruta, crear, noEncontrado }) => {
  test("PUT guarda la foto y GET la devuelve con su tipo", async () => {
    // Preparación
    const cuenta = await crear();

    // Ejecución
    const subida = await subir(ruta, cuenta.id);
    const foto = await request(app).get(`/${ruta}/${cuenta.id}/foto`);

    // Validación
    expect(subida.status).toBe(200);
    expect(subida.body.fotoSubida).toBeDefined();
    expect(foto.status).toBe(200);
    expect(foto.headers["content-type"]).toBe("image/jpeg");
    expect(Buffer.compare(foto.body, IMAGEN)).toBe(0);
  });

  test("el GET de la cuenta trae fotoSubida pero no los bytes", async () => {
    const cuenta = await crear();
    await subir(ruta, cuenta.id);

    const respuesta = await request(app).get(`/${ruta}/${cuenta.id}`);

    expect(respuesta.body.fotoSubida).toBeDefined();
    expect(respuesta.body.fotoArchivo).toBeUndefined();
  });

  test("PUT rechaza lo que no es JPG, PNG o WebP (400)", async () => {
    const cuenta = await crear();

    const respuesta = await subir(ruta, cuenta.id, "<svg></svg>", "image/svg+xml");

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.code).toBe(ErrorCatalog.FOTO_TIPO_INVALIDO.code);
  });

  test("PUT rechaza una foto vacía (400)", async () => {
    const cuenta = await crear();

    const respuesta = await subir(ruta, cuenta.id, Buffer.alloc(0));

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.code).toBe(ErrorCatalog.FOTO_TIPO_INVALIDO.code);
  });

  test("PUT rechaza una foto de más de 300 KB (413)", async () => {
    const cuenta = await crear();

    const respuesta = await subir(ruta, cuenta.id, Buffer.alloc(400 * 1024));

    expect(respuesta.status).toBe(413);
    expect(respuesta.body.code).toBe(ErrorCatalog.FOTO_MUY_GRANDE.code);
  });

  test("GET responde 404 si nunca subió una foto", async () => {
    const cuenta = await crear();

    const respuesta = await request(app).get(`/${ruta}/${cuenta.id}/foto`);

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.code).toBe(ErrorCatalog.FOTO_NO_ENCONTRADA.code);
  });

  test("DELETE borra la foto", async () => {
    const cuenta = await crear();
    await subir(ruta, cuenta.id);

    const borrado = await request(app).delete(`/${ruta}/${cuenta.id}/foto`);
    const foto = await request(app).get(`/${ruta}/${cuenta.id}/foto`);
    const datos = await request(app).get(`/${ruta}/${cuenta.id}`);

    expect(borrado.status).toBe(204);
    expect(foto.status).toBe(404);
    expect(datos.body.fotoSubida).toBeNull();
  });

  test("responde 404 si la cuenta no existe", async () => {
    const id = idInexistente();

    const subida = await subir(ruta, id);
    const foto = await request(app).get(`/${ruta}/${id}/foto`);
    const borrado = await request(app).delete(`/${ruta}/${id}/foto`);

    for (const respuesta of [subida, foto, borrado]) {
      expect(respuesta.status).toBe(404);
      expect(respuesta.body.code).toBe(noEncontrado.code);
    }
  });

  test("la baja de la cuenta borra su foto", async () => {
    const cuenta = await crear();
    await subir(ruta, cuenta.id);

    await request(app).delete(`/${ruta}/${cuenta.id}`).expect(204);
    const foto = await request(app).get(`/${ruta}/${cuenta.id}/foto`);

    expect(foto.status).toBe(404);
  });
});
