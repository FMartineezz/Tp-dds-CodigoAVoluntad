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
    /*
    const habilidadesEncontradas = habilidades.map((codigo) => {
      return this.habilidadService.obtenerHabilidadPorCodigo(codigo);
    });
 */
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
    const personasColaboradoras = await this.personaColaboradoraRepository.obtenerTodas();
    return personasColaboradoras.map((personaColaboradora) =>
      this.ocultarContactos(personaColaboradora),
    );
  }

  async obtnerPersonaColaboradoraPorId(id) {
    const personaColaboradora = await this.personaColaboradoraRepository.obtenerPorId(id);

    if (!personaColaboradora) {
      throw new AppError(ErrorCatalog.COLABORADORA_NO_ENCONTRADA, 404, id);
    }

    return this.ocultarContactos(personaColaboradora);
  }

  async obtenerPersonasConAlgunaHabilidad(codigosHabilidad) {
    const personasColaboradoras =
      await this.personaColaboradoraRepository.obtenerPorAlgunaHabilidad(codigosHabilidad);
    return personasColaboradoras.map((persona) => this.ocultarContactos(persona));
  }

  //Metodo interno para la conexion entre service
  //metodo duplicado
  /*   obtenerPersonasColaboradoras() {
    return this.personaColaboradoraRepository.obtenerTodas();
  } */

  //metodo duplicado
  /*   async obtenerPersonaColaboradoraPorId(id) {
    const personaColaboradora = await this.personaColaboradoraRepository.obtenerPorId(id);

    if (!personaColaboradora) {
      throw new AppError(ErrorCatalog.COLABORADORA_NO_ENCONTRADA, 404, id);
    }

    return personaColaboradora;
  } */

  //agregar en la query de la db?
  ocultarContactos(personaColaboradora) {
    const { contactos, ...resto } = personaColaboradora;
    return resto;
  }
}
