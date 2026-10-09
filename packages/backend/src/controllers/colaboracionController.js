export class ColaboracionController {
  constructor({ colaboracionService }) {
    this.colaboracionService = colaboracionService;
  }

  crearColaboracion = async (req, res) => {
    const colaboracion = await this.colaboracionService.crearColaboracion(
      req.body.personaColaboradoraId,
      req.body.proyectoId,
      req.body.anonima,
    );

    res.status(201).location(`/colaboraciones/${colaboracion.id}`).json(colaboracion);
  };

  obtenerColaboraciones = async (req, res) => {
    const colaboraciones = await this.colaboracionService.obtenerColaboraciones();

    res.status(200).json(colaboraciones);
  };

  obtenerColaboracionPorId = async (req, res) => {
    const id = req.params.id;

    const colaboracion = await this.colaboracionService.obtenerColaboracionPorId(id);

    res.status(200).json(colaboracion);
  };
}
