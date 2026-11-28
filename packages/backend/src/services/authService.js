export class AuthService {
  constructor({
    personaColaboradoraRepository,
    colectivoRepository,
    postulacionRepository,
    mensajeRepository,
  }) {
    this.colaboradoraRepository = personaColaboradoraRepository;
    this.colectivoRepository = colectivoRepository;
    this.postulacionRepository = postulacionRepository;
    this.mensajeRepository = mensajeRepository;
  }

  // AuthService (solo el método verificarUsuario)
  async verificarUsuario({ id: keycloakId, roles = [] }) {
    if (roles.includes("admin")) {
      return {
        perfilCompletado: true,
        rol: "adm",
      };
    }

    const colaboradora = await this.colaboradoraRepository.obtenerPorKeycloack(keycloakId);
    if (colaboradora) {
      const postulaciones = await this.postulacionRepository.obtenerPorPersona(colaboradora._id);
      const mensajes = await this.mensajeRepository.obtenerPorColaboradoraId(colaboradora._id);
      return {
        perfilCompletado: true,
        rol: "col",
        datos: {
          ...colaboradora,
          postulaciones,
          mensajes,
        },
      };
    }

    const colectivo = await this.colectivoRepository.obtenerPorKeycloack(keycloakId);
    if (colectivo) {
      return {
        perfilCompletado: true,
        rol: "org",
        datos: colectivo,
      };
    }

    return {
      perfilCompletado: false,
    };
  }
}
