export class ValoracionController {
  constructor({ valoracionService }) {
    this.valoracionService = valoracionService;
  }

  // La autenticación se integrará desde otra rama; actualmente el evaluador indica el rol
  // ("colectivo" | "persona") y las partes (autor y destinatario) se derivan internamente.
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
