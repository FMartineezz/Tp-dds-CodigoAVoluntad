import { PersonaColaboradora } from "../models/personaColaboradora.js";
import personaColaboradoraRepositoryDefault from "../repositories/personaColaboradoraRepository.js";
import habilidadServiceDefault from "./habilidadService.js";
import { AppError } from "../errors/appError.js";
import ErrorCatalog from "../errors/errorCatalog.js";

class PersonaColaboradoraService {
  constructor(
    personaColaboradoraRepository = personaColaboradoraRepositoryDefault,
    habilidadService = habilidadServiceDefault,
  ) {
    this.personaColaboradoraRepository = personaColaboradoraRepository;

    this.habilidadService = habilidadService;
  }

  crearPersonaColaboradora(
    nombreFantasia,
    git,
    nombre,
    apellido,
    habilidades,
    pronombres,
    presentacion,
  ) {
    const habilidadesEncontradas = habilidades.map((codigo) => {
      const habilidad = this.habilidadService.obtenerHabilidadPorCodigo(codigo);
      if (!habilidad) {
        throw new AppError(ErrorCatalog.COLABORADORA_HABILIDAD_INEXISTENTE, 400, codigo);
      }
      return habilidad;
    });

    const personaColaboradora = new PersonaColaboradora(
      nombreFantasia,
      git,
      nombre,
      apellido,
      habilidadesEncontradas,
      pronombres,
      presentacion,
    );

    return this.personaColaboradoraRepository.guardar(personaColaboradora);
  }

  obtenerPersonasColaboradoras() {
    return this.personaColaboradoraRepository.obtenerTodas();
  }

  obtenerPersonaColaboradoraPorId(id) {
    const persona = this.personaColaboradoraRepository.obtenerPorId(id);

    if (!persona) {
      throw new AppError(ErrorCatalog.COLABORADORA_NO_ENCONTRADA, 404, id);
    }

    return persona;
  }
}

export default new PersonaColaboradoraService();
