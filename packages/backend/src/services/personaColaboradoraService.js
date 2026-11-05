import { PersonaColaboradora } from "../models/personaColaboradora.js";
import { AppError } from "../errors/appError.js";
import ErrorCatalog from "../errors/errorCatalog.js";
import { validarYNormalizarRedesSociales } from "./redSocialService.js";

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
    redesSociales = [],
  ) {
    const redesValidadas = validarYNormalizarRedesSociales(redesSociales) ?? [];

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
      redesValidadas,
    );
    const personaColaboradoraGuardada =
      await this.personaColaboradoraRepository.guardar(personaColaboradora);
    personaColaboradora.id = personaColaboradoraGuardada.id;

    return personaColaboradora;
  }

  async actualizarPersonaColaboradora(id, cambios = {}) {
    if (!cambios || Object.keys(cambios).length === 0) {
      throw new AppError(ErrorCatalog.ARGUMENTO_INVALIDO, 400);
    }

    const persona = await this.personaColaboradoraRepository.obtenerPorId(id);
    if (!persona) {
      throw new AppError(ErrorCatalog.COLABORADORA_NO_ENCONTRADA, 404, id);
    }

    const cambiosPreparados = { ...cambios };

    if (cambios.redesSociales !== undefined) {
      cambiosPreparados.redesSociales = validarYNormalizarRedesSociales(cambios.redesSociales);
    }

    if (cambios.habilidades !== undefined) {
      cambiosPreparados.habilidades = await Promise.all(
        cambios.habilidades.map((codigo) => this.habilidadService.obtenerHabilidadPorCodigo(codigo)),
      );
    }

    return await this.personaColaboradoraRepository.actualizar(id, cambiosPreparados);
  }

  async actualizar(id, cambios) {
    return await this.actualizarPersonaColaboradora(id, cambios);
  }

  // Vista expuesta (sin contactos)
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
}
