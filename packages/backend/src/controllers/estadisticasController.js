export class EstadisticasController {
  constructor({ estadisticasService }) {
    this.estadisticasService = estadisticasService;
  }

  verEstadisticas = async (req, res) => {
    const estadisticas = await this.estadisticasService.obtenerEstadisticas();

    res.status(200).json(estadisticas);
  };
}
