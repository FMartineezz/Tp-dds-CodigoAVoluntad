export class BusquedaService {
  constructor({ proyectoService, personaColaboradoraService }) {
    this.proyectoService = proyectoService;
    this.personaColaboradoraService = personaColaboradoraService;
  }

  verPersonasColaboradorasAcordesAPerfil(proyectoId, perfilId) {
    const perfil = this.proyectoService.obtenerPerfilPorId(proyectoId, perfilId);
    const codigosHabilidadesRequeridas = perfil.habilidadesRequeridas.map(
      (habilidad) => habilidad.codigo,
    );

    return this.personaColaboradoraService.verPersonasConAlgunaHabilidad(
      codigosHabilidadesRequeridas,
    );
  }

  verProyectosAcordesALaPersonaColaboradora(personaColaboradoraId) {
    const personaColaboradora =
      this.personaColaboradoraService.obtenerPersonaColaboradoraPorId(personaColaboradoraId);
    const codigosDeHabilidad = personaColaboradora.habilidades.map((habilidad) => habilidad.codigo);
    return this.proyectoService.verProyectosConAlgunaHabilidad(codigosDeHabilidad);
  }
}
