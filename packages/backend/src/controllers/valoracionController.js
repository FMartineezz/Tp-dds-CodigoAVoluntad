/** Endpoints de valoraciones entre colectivos y personas colaboradoras (routes/valoracionRoutes.js). */
export class ValoracionController {
  /**
   * @param {object} deps
   * @param {import("../services/valoracionService.js").ValoracionService} deps.valoracionService
   */
  constructor({ valoracionService }) {
    this.valoracionService = valoracionService;
  }

  // La autenticación se integrará desde otra rama; actualmente el evaluador indica el rol
  // ("colectivo" | "persona") y las partes (autor y destinatario) se derivan internamente.
  /**
   * POST /valoraciones (body validado por validarValoracion) → 201 con la valoración.
   * @param {import("../types.js").RequestConParams} req
   * @param {import("express").Response} res
   */
  crearValoracion = async (req, res) => {
    const valoracion = await this.valoracionService.crearValoracion(
      req.body.colaboracionId,
      req.body.evaluador,
      req.body.puntaje,
      req.body.comentario,
    );

    // Sin header Location: no hay GET de un solo recurso (las valoraciones se consultan en el listado de la persona o del colectivo),
    // así que no existe una URL propia a la cual apuntar.
    res.status(201).json(valoracion);
  };

  /**
   * Atiende dos rutas; decide según qué parámetro venga:
   * - GET /personaColaboradora/:personaColaboradoraId/valoraciones
   * - GET /colectivo/:colectivoId/valoraciones
   *
   * Responde 200 con las valoraciones recibidas (la query se pasa tal cual al service).
   * @param {import("../types.js").RequestConParams} req
   * @param {import("express").Response} res
   */
  obtenerValoraciones = async (req, res) => {
    const { personaColaboradoraId, colectivoId } = req.params;

    let valoraciones;

    if (personaColaboradoraId) {
      valoraciones = await this.valoracionService.obtenerValoracionesPersona(
        personaColaboradoraId,
        req.query,
      );
    } else {
      valoraciones = await this.valoracionService.obtenerValoracionesColectivo(
        colectivoId,
        req.query,
      );
    }

    res.status(200).json(valoraciones);
  };
}
