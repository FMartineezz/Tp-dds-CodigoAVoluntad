export class ColaboracionController {
  constructor({ colaboracionService }) {
    this.colaboracionService = colaboracionService;
  }

  crearColaboracion = (req, res) => {
    const colaboracion = this.colaboracionService.crearColaboracion(
      req.body.personaColaboradoraId,
      req.body.proyectoId,
      req.body.anonima,
    );

    res.status(201).location(`/colaboraciones/${colaboracion.id}`).json(colaboracion);
  };

  verColaboraciones = (req, res) => {
    const colaboraciones = this.colaboracionService.verColaboraciones();

    res.status(200).json(colaboraciones);
  };

  verColaboracionPorId = (req, res) => {
    const id = Number(req.params.id);

    const colaboracion = this.colaboracionService.verColaboracionPorId(id);

    res.status(200).json(colaboracion);
  };
}
