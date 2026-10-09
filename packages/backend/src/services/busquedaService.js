export class BusquedaService {
  constructor({ proyectoService, personaColaboradoraService }) {
    this.proyectoService = proyectoService;
    this.personaColaboradoraService = personaColaboradoraService;
  }

  obtenerPersonasColaboradorasAcordesAPerfil(proyectoId, perfilId) {
    const perfil = this.proyectoService.obtenerPerfilPorId(proyectoId, perfilId);
    const codigosHabilidadesRequeridas = perfil.habilidadesRequeridas.map(
      (habilidad) => habilidad.codigo,
    );

    return this.personaColaboradoraService.obtenerPersonasConAlgunaHabilidad(
      codigosHabilidadesRequeridas,
    );
  }

  obtenerProyectosAcordesALaPersonaColaboradora(personaColaboradoraId) {
    const personaColaboradora =
      this.personaColaboradoraService.obtenerPersonaColaboradoraPorId(personaColaboradoraId);
    const codigosDeHabilidad = personaColaboradora.habilidades.map((habilidad) => habilidad.codigo);
    return this.proyectoService.obtenerProyectosConAlgunaHabilidad(codigosDeHabilidad);
  }
}
