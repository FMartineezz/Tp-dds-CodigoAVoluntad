export class BusquedaService {
  constructor({ proyectoService, personaColaboradoraService }) {
    this.proyectoService = proyectoService;
    this.personaColaboradoraService = personaColaboradoraService;
  }

  async obtenerPersonasColaboradorasAcordesAPerfil(proyectoId, perfilId) {
    const perfil = await this.proyectoService.obtenerPerfilPorId(proyectoId, perfilId);
    const idsHabilidadesRequeridas = perfil.habilidadesRequeridas.map((habilidad) =>
      habilidad.toString(),
    );

    return this.personaColaboradoraService.obtenerPersonasConAlgunaHabilidad(
      idsHabilidadesRequeridas,
    );
  }

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

  async obtenerProyectosAcordesALaPersonaColaboradora(personaColaboradoraId) {
    const personaColaboradora =
      await this.personaColaboradoraService.obtenerPersonaColaboradoraPorId(personaColaboradoraId);
    const idsDeHabilidad = personaColaboradora.habilidades.map((habilidad) => habilidad.toString());

    return this.proyectoService.obtenerProyectosConAlgunaHabilidad(idsDeHabilidad);
  }
}
