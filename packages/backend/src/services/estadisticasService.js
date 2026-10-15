export class EstadisticasService {
  constructor({
    colaboracionService,
    colectivoService,
    proyectoService,
    personaColaboradoraService,
  }) {
    this.colaboracionService = colaboracionService;
    this.colectivoService = colectivoService;
    this.proyectoService = proyectoService;
    this.personaColaboradoraService = personaColaboradoraService;
  }

  async obtenerEstadisticas() {
    const colaboraciones = await this.colaboracionService.obtenerEstadisticas();
    const colectivos = await this.colectivoService.obtenerEstadisticas();
    const proyectos = await this.proyectoService.obtenerEstadisticas();
    const personasColaboradoras = await this.personaColaboradoraService.obtenerEstadisticas();
    return { colaboraciones, colectivos, proyectos, personasColaboradoras };
  }
}
