/** Endpoints de postulaciones a perfiles de proyectos (routes/postulacionRoutes.js). */
export class PostulacionController {
  /**
   * @param {object} deps
   * @param {import("../services/postulacionService.js").PostulacionService} deps.postulacionService
   */
  constructor({ postulacionService }) {
    this.postulacionService = postulacionService;
  }

  /**
   * POST /proyectos/:proyectoId/perfiles/:perfilId/postulaciones (body validado por
   * validarPostulacion) → 201 con la postulación.
   * @param {import("../types.js").RequestConParams} req
   * @param {import("express").Response} res
   */
  crearPostulacion = async (req, res) => {
    const { proyectoId, perfilId } = req.params;

    const postulacion = await this.postulacionService.crearPostulacion(
      proyectoId,
      perfilId,
      req.body.personaColaboradoraId,
      req.body.anonima,
    );

    // Sin header Location: no hay GET de un solo recurso (las postulaciones se consultan en listados por persona o por colectivo),
    // así que no existe una URL propia a la cual apuntar.
    res.status(201).json(postulacion);
  };

  /**
   * PATCH /postulaciones/:postulacionId (body `{ estado, colectivoId }`; estado validado por
   * validarResolucionPostulacion) → 200 con la postulación aceptada o rechazada.
   * @param {import("../types.js").RequestConParams} req
   * @param {import("express").Response} res
   */
  actualizarPostulacion = async (req, res) => {
    const postulacionId = req.params.postulacionId;

    const postulacion = await this.postulacionService.actualizarEstado(
      postulacionId,
      req.body.estado,
      req.body.colectivoId,
    );

    res.status(200).json(postulacion);
  };

  /**
   * GET /colaboradoras/:id/postulaciones → 200 con las postulaciones de la persona.
   * @param {import("../types.js").RequestConParams} req
   * @param {import("express").Response} res
   */
  listarDePersona = async (req, res) => {
    const postulaciones = await this.postulacionService.obtenerDePersona(req.params.id);

    res.status(200).json(postulaciones);
  };

  /**
   * GET /colectivos/:colectivoId/postulaciones[?estado] → 200 con las postulaciones a proyectos
   * del colectivo.
   * @param {import("../types.js").RequestConParams} req
   * @param {import("express").Response} res
   */
  listarDeColectivo = async (req, res) => {
    const postulaciones = await this.postulacionService.obtenerDeColectivo(
      req.params.colectivoId,
      req.query.estado,
    );

    res.status(200).json(postulaciones);
  };
}
