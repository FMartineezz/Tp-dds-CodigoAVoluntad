import { respuestaPaginada } from "../utils/paginacion.js";
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
}
