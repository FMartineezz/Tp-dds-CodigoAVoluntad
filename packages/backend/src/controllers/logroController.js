/** Endpoints de logros de un proyecto, bajo /proyectos/:proyectoId/logros (routes/logroRoutes.js). */
export class LogroController {
  /**
   * @param {object} deps
   * @param {import("../services/logroService.js").LogroService} deps.logroService
   */
  constructor({ logroService }) {
    this.logroService = logroService;
  }

  /**
   * POST /proyectos/:proyectoId/logros (body validado por validarLogro) → 201 con el logro
   * y header Location.
   * @param {import("../types.js").RequestConParams} req
   * @param {import("express").Response} res
   */
  crearLogro = async (req, res) => {
    const proyectoId = req.params.proyectoId;
    const logro = await this.logroService.crearLogro(proyectoId, req.body);

    res.status(201).location(`/proyectos/${proyectoId}/logros/${logro._id}`).json(logro);
  };

  /**
   * GET /proyectos/:proyectoId/logros → 200 con los logros del proyecto.
   * @param {import("../types.js").RequestConParams} req
   * @param {import("express").Response} res
   */
  obtenerLogros = async (req, res) => {
    const logros = await this.logroService.obtenerLogros(req.params.proyectoId);

    res.status(200).json(logros);
  };

  /**
   * GET /proyectos/:proyectoId/logros/:logroId → 200 con el logro.
   * @param {import("../types.js").RequestConParams} req
   * @param {import("express").Response} res
   */
  obtenerLogroPorId = async (req, res) => {
    const logro = await this.logroService.obtenerLogroPorId(
      req.params.proyectoId,
      req.params.logroId,
    );

    res.status(200).json(logro);
  };

  /**
   * PATCH /proyectos/:proyectoId/logros/:logroId (body parcial validado) → 200 con el logro actualizado.
   * @param {import("../types.js").RequestConParams} req
   * @param {import("express").Response} res
   */
  actualizarLogro = async (req, res) => {
    const logro = await this.logroService.actualizarLogro(
      req.params.proyectoId,
      req.params.logroId,
      req.body,
    );

    res.status(200).json(logro);
  };

  /**
   * DELETE /proyectos/:proyectoId/logros/:logroId → 200 con lo que devuelve el service.
   * @param {import("../types.js").RequestConParams} req
   * @param {import("express").Response} res
   */
  eliminarLogro = async (req, res) => {
    const logro = await this.logroService.eliminarLogro(req.params.proyectoId, req.params.logroId);

    res.status(200).json(logro);
  };
}
