import { AppError } from "../errors/appError.js";
import ErrorCatalog from "../errors/errorCatalog.js";

export class AuthService {
  constructor({ personaColaboradoraRepository, colectivoRepository, postulacionRepository, mensajeRepository }) {
    this.colaboradoraRepository = personaColaboradoraRepository;
    this.colectivoRepository = colectivoRepository;
    this.postulacionRepository = postulacionRepository;
    this.mensajeRepository = mensajeRepository
  }

  async verificarUsuario(keycloakId) {
    const colaboradora = await this.colaboradoraRepository.obtenerPorKeycloack(keycloakId);
    if (colaboradora) {
      const postulaciones = await this.postulacionRepository.obtenerPorPersona(colaboradora._id);
      const mensajes = await this.mensajeRepository.obtenerPorColaboradoraId(colaboradora._id);
      return {
        perfilCompletado: true,
        rol: "colaboradora",
        datos: {
          ...colaboradora,
          postulaciones,
          mensajes
        }
      };
    }

    const colectivo = await this.colectivoRepository.obtenerPorKeycloack(keycloakId);
    if (colectivo) {
      return {
        perfilCompletado: true,
        rol: "colectivo",
        datos: colectivo,
      };
    }

    return {
      perfilCompletado: false,
    };
  }
}
