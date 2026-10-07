import { PersonaColaboradora } from "../models/personaColaboradora.js";
import { AppError } from "../errors/appError.js";
import ErrorCatalog from "../errors/errorCatalog.js";

export class PersonaColaboradoraService {
  constructor({ personaColaboradoraRepository, habilidadService }) {
    this.personaColaboradoraRepository = personaColaboradoraRepository;

    this.habilidadService = habilidadService;
  }

  async crearPersonaColaboradora(
    nombreFantasia,
    git,
    nombre,
    apellido,
    habilidades,
    pronombres,
    presentacion,
  ) {

/*
    const habilidadesEncontradas = habilidades.map((codigo) => {
      return this.habilidadService.obtenerHabilidadPorCodigo(codigo);
    });
 */
    const habilidadesEncontradas = await this.habilidadService.obtenerHabilidadesPorCodigos(habilidades);
    const personaColaboradora = new PersonaColaboradora(
      nombreFantasia,
      git,
      nombre,
      apellido,
      habilidadesEncontradas,
      pronombres,
      presentacion,
    );

    return await this.personaColaboradoraRepository.guardar(personaColaboradora);
  }

  async obtenerPersonasColaboradoras() {
    return await this.personaColaboradoraRepository.obtenerTodas();
  }

  async obtenerPersonaColaboradoraPorId(id) {
    const persona = await this.personaColaboradoraRepository.obtenerPorId(id);

    if (!persona) {
      throw new AppError(ErrorCatalog.COLABORADORA_NO_ENCONTRADA, 404, id);
    }

    return persona;
  }
}
