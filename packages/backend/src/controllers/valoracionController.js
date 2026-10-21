export class ValoracionController {
  constructor({ valoracionService }) {
    this.valoracionService = valoracionService;
  }

  // esto habria q cambiarlo (quitar evaluador) vuando tengamos la autenticacion y el evaluador se obtenga del token
  crearValoracion = async (req, res) => {
    const valoracion = await this.valoracionService.crearValoracion(
      req.body.colaboracionId,
      req.body.evaluador,
      req.body.puntaje,
      req.body.comentario,
    );

    res.status(201).json(valoracion);
  };

  obtenerValoraciones = async (req, res) => {
    const { personaColaboradoraId, colectivoId } = req.params;

    let valoraciones;

    if (personaColaboradoraId) {
      valoraciones =
        await this.valoracionService.obtenerValoracionesPersona(
          personaColaboradoraId,
        );
    } else {
      valoraciones =
        await this.valoracionService.obtenerValoracionesColectivo(
          colectivoId,
        );
    }

    res.status(200).json(valoraciones);
  };
}
