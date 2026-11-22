/**
 * Endpoints de colaboraciones (rutas en routes/colaboracionRoutes.js).
 * Las colaboraciones se crean al aceptar una postulación; acá solo se consultan y se dan de baja.
 */
export class ColaboracionController {
  /**
   * @param {object} deps
   * @param {import("../services/colaboracionService.js").ColaboracionService} deps.colaboracionService
   */
  constructor({ colaboracionService }) {
    this.colaboracionService = colaboracionService;
  }

  /**
   * GET /colaboraciones → 200 con todas las colaboraciones.
   * @param {import("../types.js").RequestConParams} req
   * @param {import("express").Response} res
   */
  obtenerColaboraciones = async (req, res) => {
    const colaboraciones = await this.colaboracionService.obtenerColaboraciones();

    res.status(200).json(colaboraciones);
  };

  /**
   * GET /colaboraciones/:id → 200 con la colaboración.
   * @param {import("../types.js").RequestConParams} req
   * @param {import("express").Response} res
   */
  obtenerColaboracionPorId = async (req, res) => {
    const id = req.params.id;

    const colaboracion = await this.colaboracionService.obtenerColaboracionPorId(id);

    res.status(200).json(colaboracion);
  };

  /**
   * GET /colaboradoras/:personaColaboradoraId/colaboraciones → 200 con el historial de la persona
   * (activas y dadas de baja).
   * @param {import("../types.js").RequestConParams} req
   * @param {import("express").Response} res
   */
  obtenerColaboracionesDePersona = async (req, res) => {
    const colaboraciones = await this.colaboracionService.obtenerColaboracionesDePersona(
      req.params.personaColaboradoraId,
    );

    res.status(200).json(colaboraciones);
  };

  /**
   * GET /proyectos/:proyectoId/colaboraciones → 200 con el equipo del proyecto
   * (activas y dadas de baja).
   * @param {import("../types.js").RequestConParams} req
   * @param {import("express").Response} res
   */
  obtenerColaboracionesDeProyecto = async (req, res) => {
    const colaboraciones = await this.colaboracionService.obtenerColaboracionesDeProyecto(
      req.params.proyectoId,
    );

    res.status(200).json(colaboraciones);
  };

  /**
   * DELETE /colaboraciones/:id[?por=persona|colectivo] → 200 con `{ message }`.
   * Es una baja lógica: la colaboración queda inactiva.
   * @param {import("../types.js").RequestConParams} req
   * @param {import("express").Response} res
   */
  desactivarColaboracion = async (req, res) => {
    const id = req.params.id;

    // El cast es solo para tsc: el service valida que `por` sea un OrigenBaja (si no, 400).
    const por = /** @type {import("../services/colaboracionService.js").OrigenBajaValor} */ (req.query.por);
    await this.colaboracionService.desactivarColaboracion(id, por);
    res.status(200).json( { message: "Colaboración desactivada correctamente" });
  }
}
