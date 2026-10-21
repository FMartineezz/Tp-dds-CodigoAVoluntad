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

  desactivarColaboracion = async (req, res) => {
    const id = req.params.id;

    await this.colaboracionService.desactivarColaboracion(id);
    res.status(200).json( { message: "Colaboración desactivada correctamente" });
  }
}
