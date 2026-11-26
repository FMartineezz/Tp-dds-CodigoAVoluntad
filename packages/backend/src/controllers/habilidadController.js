/** Endpoints de habilidades (routes/habilidadRoutes.js). */
export class HabilidadController {
  /**
   * @param {object} deps
   * @param {import("../services/habilidadService.js").HabilidadService} deps.habilidadService
   */
  constructor({ habilidadService }) {
    this.habilidadService = habilidadService;
  }

  /**
   * POST /habilidades (body validado por validarHabilidad) → 201 con la habilidad y header Location.
   * @param {import("../types.js").RequestConParams} req
   * @param {import("express").Response} res
   */
  crearHabilidad = async (req, res) => {
    const respuesta = await this.habilidadService.crearHabilidad(
      req.body.titulo,
      req.body.descripcion,
    );
    res.status(201).location(`/habilidades/${respuesta.id}`).json(respuesta);
  };

  /**
   * GET /habilidades → 200 con todas las habilidades.
   * @param {import("../types.js").RequestConParams} req
   * @param {import("express").Response} res
   */
  obtenerHabilidades = async (req, res) => {
    const respuesta = await this.habilidadService.obtenerHabilidades();
    res.status(200).json(respuesta);
  };

  /**
   * GET /habilidades/:id → 200 con la habilidad.
   * @param {import("../types.js").RequestConParams} req
   * @param {import("express").Response} res
   */
  obtenerHabilidadPorId = async (req, res) => {
    const id = req.params.id;

    const respuesta = await this.habilidadService.obtenerHabilidadPorId(id);
    res.status(200).json(respuesta);
  };
}
