import { AppError } from "../errors/appError.js";
import ErrorCatalog from "../errors/errorCatalog.js";

export class AuthService {
  constructor({ personaColaboradoraRepository, colectivoRepository }) {
    this.colaboradoraRepository = personaColaboradoraRepository;
    this.colectivoRepository = colectivoRepository;
  }

  async verificarUsuario(keycloakId) {
    const colaboradora = await this.colaboradoraRepository.obtenerPorKeycloack(keycloakId);
    if (colaboradora) {
      return {
        perfilCompletado: true,
        rol: "colaboradora",
        datos: colaboradora,
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
