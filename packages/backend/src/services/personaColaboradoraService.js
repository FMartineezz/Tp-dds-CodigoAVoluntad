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
    contactos,
    bloquearMensajeInterno,
  ) {
    const habilidadesEncontradas = await Promise.all(
      habilidades.map((codigo) => {
        return this.habilidadService.obtenerHabilidadPorCodigo(codigo);
      }),
    );

    const personaColaboradora = new PersonaColaboradora(
      nombreFantasia,
      git,
      nombre,
      apellido,
      habilidadesEncontradas,
      pronombres,
      presentacion,
      contactos,
      bloquearMensajeInterno,
    );
    const personaColaboradoraGuardada =
      await this.personaColaboradoraRepository.guardar(personaColaboradora);
    personaColaboradora.id = personaColaboradoraGuardada.id;

    return personaColaboradora;
  }

  //Vista expuesta (sin contactos)
  async obtenerPersonasColaboradoras() {
    return await this.personaColaboradoraRepository.obtenerTodas();
  }

  async obtenerPersonaColaboradoraPorId(id) {
    const personaColaboradora = await this.personaColaboradoraRepository.obtenerPorId(id);

    if (!personaColaboradora) {
      throw new AppError(ErrorCatalog.COLABORADORA_NO_ENCONTRADA, 404, id);
    }

    return personaColaboradora;
  }

  async obtenerPersonasConAlgunaHabilidad(idsHabilidades) {
    return await this.personaColaboradoraRepository.obtenerPorHabilidadId(idsHabilidades);
  }

  async obtenerPersonaColaboradoraPorIdConContactos(id) {
    const personaColaboradora = await this.personaColaboradoraRepository.obtenerPorIdConContactos(id);

    if (!personaColaboradora) {
      throw new AppError(ErrorCatalog.COLABORADORA_NO_ENCONTRADA, 404, id);
    }

    return personaColaboradora;
  }

  //agregar en la query de la db?
/*   ocultarContactos(personaColaboradora) {
    const { contactos, ...resto } = personaColaboradora;
    return resto;
  } */
}
