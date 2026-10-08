import { PersonaColaboradora } from "../models/personaColaboradora.js";
import { AppError } from "../errors/appError.js";
import ErrorCatalog from "../errors/errorCatalog.js";

export class PersonaColaboradoraService {
  constructor({ personaColaboradoraRepository, habilidadService }) {
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
    contactos,
    bloquearMensajeInterno,
  ) {
    const habilidadesEncontradas = habilidades.map((codigo) => {
      return this.habilidadService.obtenerHabilidadPorCodigo(codigo);
    });

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

    return this.personaColaboradoraRepository.guardar(personaColaboradora);
  }

  //Vista expuesta (sin contactos)
  verPersonasColaboradoras() {
    const personasColaboradoras = this.personaColaboradoraRepository.obtenerTodas();
    return personasColaboradoras.map((personaColaboradora) =>
      this.ocultarContactos(personaColaboradora),
    );
  }

  verPersonaColaboradoraPorId(id) {
    const personaColaboradora = this.personaColaboradoraRepository.obtenerPorId(id);

    if (!personaColaboradora) {
      throw new AppError(ErrorCatalog.COLABORADORA_NO_ENCONTRADA, 404, id);
    }

    return this.ocultarContactos(personaColaboradora);
  }

  verPersonasConAlgunaHabilidad(codigosHabilidad) {
    const personasColaboradoras =
      this.personaColaboradoraRepository.obtenerPorAlgunaHabilidad(codigosHabilidad);
    return personasColaboradoras.map((persona) => this.ocultarContactos(persona));
  }

  //Metodo interno para la conexion entre service
  obtenerPersonasColaboradoras() {
    return this.personaColaboradoraRepository.obtenerTodas();
  }

  obtenerPersonaColaboradoraPorId(id) {
    const personaColaborado = this.personaColaboradoraRepository.obtenerPorId(id);

    if (!persona) {
      throw new AppError(ErrorCatalog.COLABORADORA_NO_ENCONTRADA, 400, id);
    }

    return personaColaborado;
  }

  ocultarContactos(personaColaboradora) {
    const { contactos, ...resto } = personaColaboradora;
    return resto;
  }
}
