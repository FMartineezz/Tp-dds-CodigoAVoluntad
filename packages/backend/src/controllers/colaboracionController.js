export class ColaboracionController {
  constructor({ colaboracionService }) {
    this.colaboracionService = colaboracionService;
  }

  obtenerColaboraciones = async (req, res) => {
    const colaboraciones = await this.colaboracionService.obtenerColaboraciones();

    res.status(200).json(colaboraciones);
  };

  obtenerColaboracionPorId = async (req, res) => {
    const id = req.params.id;

    const colaboracion = await this.colaboracionService.obtenerColaboracionPorId(id);

    res.status(200).json(colaboracion);
  };

  obtenerColaboracionesDePersona = async (req, res) => {
    const colaboraciones = await this.colaboracionService.obtenerColaboracionesDePersona(
      req.params.personaColaboradoraId,
    );

    res.status(200).json(colaboraciones);
  };

  obtenerColaboracionesDeProyecto = async (req, res) => {
    const colaboraciones = await this.colaboracionService.obtenerColaboracionesDeProyecto(
      req.params.proyectoId,
    );

    res.status(200).json(colaboraciones);
  };

  desactivarColaboracion = async (req, res) => {
    const id = req.params.id;

    await this.colaboracionService.desactivarColaboracion(id, req.query.por);
    res.status(200).json( { message: "Colaboración desactivada correctamente" });
  }
}
