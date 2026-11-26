import { respuestaPaginada } from "../utils/paginacion.js";
import { TIPOS_DE_FOTO } from "../middlewares/validations/fotoValidation.js";
/** Endpoints de colectivos (rutas en routes/colectivoRoutes.js). */
export class ColectivoController {
  /**
   * @param {object} deps
   * @param {import("../services/colectivoService.js").ColectivoService} deps.service
   */
  constructor({ service }) {
    this.service = service;
  }

  /**
   * POST /colectivos (body validado por validarColectivo) → 201 con el colectivo creado
   * (sin `denuncias`) y header Location.
   * @param {import("../types.js").RequestConParams} req
   * @param {import("express").Response} res
   */
  crearColectivo = async (req, res) => {
    const respuesta = await this.service.crearColectivo(
      req.body.nombre,
      req.body.descripcion,
      req.body.ubicacion,
      req.body.tipoDeColectivo,
      req.user.id,
      req.body.redesSociales
    );
    delete respuesta.denuncias;
    res.status(201).location(`/colectivos/${respuesta.id}`).json(respuesta);
  };

  /**
   * PATCH /colectivos/:id (body parcial validado) → 200 con el colectivo actualizado.
   * @param {import("../types.js").RequestConParams} req
   * @param {import("express").Response} res
   */
  actualizarColectivo = async (req, res) => {
    const id = req.params.id;

    const respuesta = await this.service.actualizarColectivo(id, req.body);
    res.status(200).json(respuesta);
  };

  /**
   * GET /colectivos?pagina&limite → 200 con una RespuestaPaginada de colectivos.
   * @param {import("../types.js").RequestPaginado} req
   * @param {import("express").Response} res
   */
  obtenerColectivos = async (req, res) => {
    const pagina = await this.service.obtenerColectivos(req.paginacion);
    res.status(200).json(respuestaPaginada(pagina, req.paginacion));
  };

  /**
   * GET /admin/colectivos/bajas → 200 con los colectivos dados de baja (los últimos primero).
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  obtenerDadosDeBaja = async (req, res) => {
    const respuesta = await this.service.obtenerDadosDeBaja();
    res.status(200).json(respuesta);
  };

  /**
   * GET /colectivos/:id → 200 con el colectivo.
   * @param {import("../types.js").RequestConParams} req
   * @param {import("express").Response} res
   */
  obtenerColectivoPorId = async (req, res) => {
    const id = req.params.id;

    const respuesta = await this.service.obtenerColectivoPorId(id);
    res.status(200).json(respuesta);
  };

  /**
   * DELETE /colectivos/:id → 204 (sin cuerpo).
   * @param {import("../types.js").RequestConParams} req
   * @param {import("express").Response} res
   */
  eliminarColectivo = async (req, res) => {
    const id = req.params.id;

    const respuesta = await this.service.eliminarColectivo(id);
    res.status(204).json(respuesta);
  };

  // ───── Foto de perfil subida ─────

  /**
   * PUT /colectivos/:id/foto (cuerpo: los bytes de la imagen) → 200 con { fotoSubida }.
   * @param {import("../types.js").RequestConParams} req
   * @param {import("express").Response} res
   */
  subirFoto = async (req, res) => {
    // req.is devuelve el tipo sin «; charset…» (ya se validó en recibirFoto)
    const foto = { datos: req.body, tipo: req.is(TIPOS_DE_FOTO) };
    const respuesta = await this.service.subirFoto(req.params.id, foto);
    res.status(200).json(respuesta);
  };

  /**
   * GET /colectivos/:id/foto → 200 con la imagen (no JSON).
   * @param {import("../types.js").RequestConParams} req
   * @param {import("express").Response} res
   */
  obtenerFoto = async (req, res) => {
    const foto = await this.service.obtenerFoto(req.params.id);
    res.set({
      "Content-Type": foto.tipo,
      // El front pide …/foto?v=<fotoSubida>: si cambia la foto, cambia la URL
      "Cache-Control": "public, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    });
    res.status(200).send(foto.datos);
  };

  /**
   * DELETE /colectivos/:id/foto → 204 (sin cuerpo).
   * @param {import("../types.js").RequestConParams} req
   * @param {import("express").Response} res
   */
  borrarFoto = async (req, res) => {
    await this.service.borrarFoto(req.params.id);
    res.status(204).send();
  };
}
