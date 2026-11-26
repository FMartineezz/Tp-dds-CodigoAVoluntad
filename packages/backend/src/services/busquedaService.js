/** @typedef {import("../types.js").Id} Id */
/** @typedef {import("../errors/appError.js").AppError} AppError */
/** @typedef {import("../types.js").Paginacion} Paginacion */
/**
 * @template T
 * @typedef {import("../types.js").Pagina<T>} Pagina
 */
/** @typedef {import("../types.js").ProyectoGuardado} ProyectoGuardado */
/** @typedef {import("../types.js").PersonaColaboradoraGuardada} PersonaColaboradoraGuardada */

/**
 * Cruza habilidades entre proyectos y personas colaboradoras para sugerir coincidencias.
 */
export class BusquedaService {
  /**
   * @param {object} deps
   * @param {import("./proyectoService.js").ProyectoService} deps.proyectoService
   * @param {import("./personaColaboradoraService.js").PersonaColaboradoraService} deps.personaColaboradoraService
   */
  constructor({ proyectoService, personaColaboradoraService }) {
    this.proyectoService = proyectoService;
    this.personaColaboradoraService = personaColaboradoraService;
  }

  /**
   * Personas que tienen al menos una de las habilidades que pide el perfil (sin paginar).
   * @param {Id} proyectoId
   * @param {Id} perfilId
   * @returns {Promise<PersonaColaboradoraGuardada[]>}
   * @throws {AppError} 404 si no existe el proyecto o el perfil.
   */
  async obtenerPersonasColaboradorasAcordesAPerfil(proyectoId, perfilId) {
    const perfil = await this.proyectoService.obtenerPerfilPorId(proyectoId, perfilId);
    const idsHabilidadesRequeridas = perfil.habilidadesRequeridas.map((habilidad) =>
      habilidad.toString(),
    );

    return this.personaColaboradoraService.obtenerPersonasConAlgunaHabilidad(
      idsHabilidadesRequeridas,
    );
  }

  /**
   * Personas que tienen al menos una habilidad pedida por alguno de los perfiles del proyecto.
   * @param {ProyectoGuardado} proyecto
   * @returns {Promise<PersonaColaboradoraGuardada[]>}
   */
  async obtenerPersonasColaboradorasAcordesAProyecto(proyecto) {
    const idsHabilidadesRequeridas = new Set();
    for (const perfil of proyecto.perfiles) {
      perfil.habilidadesRequeridas.forEach((habilidad) => {
        idsHabilidadesRequeridas.add(habilidad.toString());
      });
    }
    return this.personaColaboradoraService.obtenerPersonasConAlgunaHabilidad([
      ...idsHabilidadesRequeridas,
    ]);
  }

  /**
   * Proyectos que piden al menos una de las habilidades de la persona (sin paginar).
   * @param {Id} personaColaboradoraId
   * @returns {Promise<ProyectoGuardado[]>}
   * @throws {AppError} 404 si no existe la persona.
   */
  async obtenerProyectosAcordesALaPersonaColaboradora(personaColaboradoraId) {
    const personaColaboradora =
      await this.personaColaboradoraService.obtenerPersonaColaboradoraPorId(personaColaboradoraId);
    const idsDeHabilidad = personaColaboradora.habilidades.map((habilidad) => habilidad.toString());

    return this.proyectoService.obtenerProyectosConAlgunaHabilidad(idsDeHabilidad);
  }

  // Versiones paginadas para los endpoints de búsqueda. Las de arriba devuelven todo porque
  // las usan las notificaciones automáticas, que tienen que avisarle a cada coincidencia.
  /**
   * Página de personas acordes a un perfil.
   * @param {Id} proyectoId
   * @param {Id} perfilId
   * @param {Paginacion} paginacion
   * @returns {Promise<Pagina<PersonaColaboradoraGuardada>>}
   * @throws {AppError} 404 si no existe el proyecto o el perfil.
   */
  async buscarColaboradorasParaPerfil(proyectoId, perfilId, paginacion) {
    const perfil = await this.proyectoService.obtenerPerfilPorId(proyectoId, perfilId);
    const idsHabilidadesRequeridas = perfil.habilidadesRequeridas.map((habilidad) =>
      habilidad.toString(),
    );

    return this.personaColaboradoraService.obtenerPaginaDePersonasConAlgunaHabilidad(
      idsHabilidadesRequeridas,
      paginacion,
    );
  }

  /**
   * Página de proyectos acordes a las habilidades de una persona.
   * @param {Id} personaColaboradoraId
   * @param {Paginacion} paginacion
   * @returns {Promise<Pagina<ProyectoGuardado>>}
   * @throws {AppError} 404 si no existe la persona.
   */
  async buscarProyectosParaColaboradora(personaColaboradoraId, paginacion) {
    const personaColaboradora =
      await this.personaColaboradoraService.obtenerPersonaColaboradoraPorId(personaColaboradoraId);
    const idsDeHabilidad = personaColaboradora.habilidades.map((habilidad) => habilidad.toString());

    return this.proyectoService.obtenerPaginaDeProyectosConAlgunaHabilidad(
      idsDeHabilidad,
      paginacion,
    );
  }
}
