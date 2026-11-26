/**
 * Junta en un solo objeto las estadísticas de cada servicio (para GET /estadisticas).
 */
export class EstadisticasService {
  /**
   * @param {object} deps
   * @param {import("./colaboracionService.js").ColaboracionService} deps.colaboracionService
   * @param {import("./colectivoService.js").ColectivoService} deps.colectivoService
   * @param {import("./proyectoService.js").ProyectoService} deps.proyectoService
   * @param {import("./personaColaboradoraService.js").PersonaColaboradoraService} deps.personaColaboradoraService
   * @param {import("./postulacionService.js").PostulacionService} deps.postulacionService
   */
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

  /**
   * Estadísticas generales agrupadas por entidad.
   * @returns {Promise<{
   *   estadisticasColaboraciones: { total: number, anonimas: number, publicas: number },
   *   estadisticasColectivos: { total: number, porUbicacion: { ubicacion: string, cantidad: number }[] },
   *   estadisticasProyectos: { proyectos: object, postulacionesPorProyecto: object },
   *   estadisticasPersonasColaboradoras: object,
   * }>}
   */
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
