export class EstadisticasService {
  constructor({
    colaboracionService,
    colectivoService,
    proyectoService,
    personaColaboradoraService,
    postulacionService,
  }) {
    this.colaboracionService = colaboracionService;
    this.colectivoService = colectivoService;
    this.proyectoService = proyectoService;
    this.personaColaboradoraService = personaColaboradoraService;
    this.postulacionService = postulacionService;
  }

  async obtenerEstadisticas() {
    const estadisticasColaboraciones = await this.colaboracionService.obtenerEstadisticas();
    const estadisticasColectivos = await this.colectivoService.obtenerEstadisticas();
    const proyectos = await this.proyectoService.obtenerEstadisticas();
    const estadisticasPersonasColaboradoras =
      await this.personaColaboradoraService.obtenerEstadisticas();
    const postulacion = await this.postulacionService.obtenerEstadisticas();

    const estadisticasProyectos = { proyectos, postulacionesPorProyecto: postulacion };

    return {
      estadisticasColaboraciones,
      estadisticasColectivos,
      estadisticasProyectos,
      estadisticasPersonasColaboradoras,
    };
  }
}
