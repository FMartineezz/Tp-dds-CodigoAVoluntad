import { PersonaColaboradora } from "../models/personaColaboradora.js";
import { AppError } from "../errors/appError.js";
import ErrorCatalog from "../errors/errorCatalog.js";
import { validarYNormalizarRedesSociales } from "./redSocialService.js";
import { eventos, EVENTO_PERSONA_CREADA } from "../events/events.js";

/** @typedef {import("../types.js").Id} Id */
/** @typedef {import("../types.js").Paginacion} Paginacion */
/** @typedef {import("../types.js").HabilidadGuardada} HabilidadGuardada */
/** @typedef {import("../types.js").PersonaColaboradoraGuardada} PersonaColaboradoraGuardada */
/** @typedef {import("../models/personaColaboradora.js").MedioDeContacto} MedioDeContacto */
/** @typedef {import("../models/redSocial.js").RedSocial} RedSocial */

/**
 * Cambios de un PATCH de persona tal como llegan en el body (habilidades por CÓDIGO).
 * @typedef {object} CambiosDePersonaColaboradora
 * @property {string} [nombreFantasia]
 * @property {string} [git]
 * @property {string | null} [nombre]
 * @property {string | null} [apellido]
 * @property {string[]} [habilidades] Códigos de habilidad.
 * @property {string[] | null} [pronombres]
 * @property {string | null} [presentacion]
 * @property {MedioDeContacto[]} [contactos]
 * @property {boolean} [bloquearMensajeInterno]
 * @property {unknown} [redesSociales] Se valida con validarYNormalizarRedesSociales.
 */

/**
 * Estadísticas generales de las personas colaboradoras.
 * @typedef {object} EstadisticasDePersonas
 * @property {number} total
 * @property {number} bloqueanMensajes
 * @property {number} promedioHabilidadesPorPersona
 * @property {number} promedioPostulacionesPorPersona
 */

/**
 * Alta, modificación y consulta de personas colaboradoras.
 */
export class PersonaColaboradoraService {
  /**
   * @param {object} deps
   * @param {import("../repositories/personaColaboradoraRepository.js").PersonaColaboradoraRepository} deps.personaColaboradoraRepository
   * @param {import("./habilidadService.js").HabilidadService} deps.habilidadService
   * @param {import("../repositories/colaboracionRepository.js").ColaboracionRepository} deps.colaboracionRepository
   */
  constructor({ personaColaboradoraRepository, habilidadService, colaboracionRepository }) {
    this.personaColaboradoraRepository = personaColaboradoraRepository;
    this.habilidadService = habilidadService;
    this.colaboracionRepository = colaboracionRepository;
  }

  /**
   * Crea una persona colaboradora y emite EVENTO_PERSONA_CREADA (dispara notificaciones).
   * @param {string} nombreFantasia
   * @param {string} git
   * @param {string | null} nombre
   * @param {string | null} apellido
   * @param {string[]} habilidades Códigos de habilidad.
   * @param {string[] | null} pronombres
   * @param {string | null} presentacion
   * @param {MedioDeContacto[]} contactos
   * @param {boolean} bloquearMensajeInterno
   * @param {unknown} [redesSociales] Lista de `{ tipo, url }` a validar.
   * @param {string | null} [foto] URL de la foto de perfil.
   * @param {string | null} [sitioWeb]
   * @returns {Promise<PersonaColaboradora>} La persona con el `id` asignado.
   * @throws {AppError} 400 si algún código de habilidad no existe o las redes son inválidas.
   */
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
    foto = null,
    sitioWeb = null,
  ) {
    const redesValidadas = validarYNormalizarRedesSociales(redesSociales) ?? [];

    // Una sola consulta para todas las habilidades (no un findOne por cada una)
    const mapaHabilidades = await this.habilidadService.obtenerMapaPorCodigos(habilidades);
    const habilidadesEncontradas = habilidades.map((codigo) => mapaHabilidades.get(codigo));

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
      foto,
      sitioWeb,
    );
    const personaColaboradoraGuardada =
      await this.personaColaboradoraRepository.guardar(personaColaboradora);
    personaColaboradora.id = personaColaboradoraGuardada.id;

    eventos.emit(EVENTO_PERSONA_CREADA, personaColaboradoraGuardada);

    return personaColaboradora;
  }

  /**
   * Aplica un PATCH a una persona, traduciendo habilidades y validando redes sociales.
   * @param {Id} id
   * @param {CambiosDePersonaColaboradora} [cambios]
   * @returns {Promise<PersonaColaboradoraGuardada>} La persona actualizada.
   * @throws {AppError} 400 si no hay cambios o son inválidos; 404 si la persona no existe.
   */
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
      const mapaHabilidades = await this.habilidadService.obtenerMapaPorCodigos(cambios.habilidades);
      cambiosPreparados.habilidades = cambios.habilidades.map((codigo) => mapaHabilidades.get(codigo));
    }

    return await this.personaColaboradoraRepository.actualizar(id, cambiosPreparados);
  }

  /**
   * Alias de {@link PersonaColaboradoraService#actualizarPersonaColaboradora}.
   * @param {Id} id
   * @param {CambiosDePersonaColaboradora} cambios
   * @returns {Promise<PersonaColaboradoraGuardada>}
   * @throws {AppError} 400 si los cambios son inválidos; 404 si la persona no existe.
   */
  async actualizar(id, cambios) {
    return await this.actualizarPersonaColaboradora(id, cambios);
  }

  // Vista expuesta (sin contactos). La habilidad llega por CÓDIGO y se pasa a id para filtrar
  /**
   * Página de personas colaboradoras (sin contactos), con filtros opcionales.
   * @param {Paginacion} paginacion
   * @param {{ busqueda?: string, habilidad?: string, aceptaMensajes?: boolean }} [filtros]
   * @returns {Promise<import("../types.js").Pagina<PersonaColaboradoraGuardada>>}
   * @throws {AppError} 400 si no existe una habilidad con ese código.
   */
  async obtenerPersonasColaboradoras(paginacion, { busqueda, habilidad, aceptaMensajes } = {}) {
    const habilidadId = habilidad
      ? (await this.habilidadService.obtenerHabilidadPorCodigo(habilidad))._id
      : undefined;

    return await this.personaColaboradoraRepository.obtenerPagina(paginacion, {
      busqueda,
      habilidadId,
      aceptaMensajes,
    });
  }

  /**
   * Busca una persona por id (sin contactos).
   * @param {Id} id
   * @returns {Promise<PersonaColaboradoraGuardada>}
   * @throws {AppError} 404 si la persona no existe.
   */
  async obtenerPersonaColaboradoraPorId(id) {
    const personaColaboradora = await this.personaColaboradoraRepository.obtenerPorId(id);

    if (!personaColaboradora) {
      throw new AppError(ErrorCatalog.COLABORADORA_NO_ENCONTRADA, 404, id);
    }

    return personaColaboradora;
  }

  /**
   * Todas las personas que tienen al menos una de las habilidades indicadas.
   * @param {Id[]} idsHabilidades
   * @returns {Promise<PersonaColaboradoraGuardada[]>}
   */
  async obtenerPersonasConAlgunaHabilidad(idsHabilidades) {
    return await this.personaColaboradoraRepository.obtenerPorHabilidadId(idsHabilidades);
  }

  /**
   * Versión paginada de {@link PersonaColaboradoraService#obtenerPersonasConAlgunaHabilidad}.
   * @param {Id[]} idsHabilidades
   * @param {Paginacion} paginacion
   * @returns {Promise<import("../types.js").Pagina<PersonaColaboradoraGuardada>>}
   */
  async obtenerPaginaDePersonasConAlgunaHabilidad(idsHabilidades, paginacion) {
    return await this.personaColaboradoraRepository.obtenerPaginaPorHabilidadId(
      idsHabilidades,
      paginacion,
    );
  }

  /**
   * Busca una persona por id incluyendo sus contactos privados.
   * @param {Id} id
   * @returns {Promise<PersonaColaboradoraGuardada>}
   * @throws {AppError} 404 si la persona no existe.
   */
  async obtenerPersonaColaboradoraPorIdConContactos(id) {
    const personaColaboradora =
      await this.personaColaboradoraRepository.obtenerPorIdConContactos(id);

    if (!personaColaboradora) {
      throw new AppError(ErrorCatalog.COLABORADORA_NO_ENCONTRADA, 404, id);
    }

    return personaColaboradora;
  }

  /**
   * Contactos privados de una persona. Según el enunciado solo los ven la dueña del perfil y
   * los colectivos con los que colabora; para cualquier otra persona el pedido falla.
   * @param {Id} id La persona dueña de los contactos.
   * @param {{ colaboradoraId?: Id, colectivoId?: Id }} solicitante Quién los pide.
   * @returns {Promise<MedioDeContacto[]>}
   * @throws {AppError} 404 si la persona no existe; 403 si quien pide no tiene acceso.
   */
  async obtenerContactos(id, { colaboradoraId, colectivoId } = {}) {
    const persona = await this.obtenerPersonaColaboradoraPorIdConContactos(id);

    const esLaDuena = colaboradoraId != null && String(colaboradoraId) === String(id);
    const esSuColectivo =
      colectivoId != null &&
      (await this.colaboracionRepository.existeActivaConColectivo(id, colectivoId));

    if (!esLaDuena && !esSuColectivo) {
      throw new AppError(ErrorCatalog.COLABORADORA_CONTACTOS_SIN_ACCESO, 403, id);
    }

    return persona.contactos ?? [];
  }

  //agregar en la query de la db?
  /**
   * Devuelve una copia de la persona sin el campo `contactos`.
   * @template {{ contactos?: unknown }} T
   * @param {T} personaColaboradora
   * @returns {Omit<T, "contactos">}
   */
  ocultarContactos(personaColaboradora) {
    const { contactos, ...resto } = personaColaboradora;
    return resto;
  }

  /**
   * Da de baja la cuenta de una persona (DELETE /colaboradoras/:id): sus datos personales se
   * anonimizan y sus contactos se borran, pero sus colaboraciones quedan en el historial.
   * @param {Id} id
   * @returns {Promise<void>}
   * @throws {AppError} 404 si no existe; 409 si ya estaba dada de baja.
   */
  async eliminarPersonaColaboradora(id) {
    const resultado = await this.personaColaboradoraRepository.eliminar(id);
    if (!resultado.razon) return; // se anonimizó bien

    if (resultado.razon === "NO_ENCONTRADO") {
      throw new AppError(ErrorCatalog.COLABORADORA_NO_ENCONTRADA, 404, id);
    }
    throw new AppError(ErrorCatalog.COLABORADORA_YA_DADA_DE_BAJA, 409, id);
  }

  //Estadisticas
  /**
   * Totales y promedios de las personas colaboradoras (todo en 0 si no hay ninguna).
   * @returns {Promise<EstadisticasDePersonas>}
   */
  async obtenerEstadisticas() {
    const resultado = await this.personaColaboradoraRepository.obtenerEstadisticas();
    const {
      total,
      bloqueanMensajes,
      promedioHabilidadesPorPersona,
      promedioPostulacionesPorPersona,
    } = resultado[0] ?? {
      total: 0,
      bloqueanMensajes: 0,
      promedioHabilidadesPorPersona: 0,
      promedioPostulacionesPorPersona: 0,
    };
    return {
      total,
      bloqueanMensajes,
      promedioHabilidadesPorPersona,
      promedioPostulacionesPorPersona,
    };
  }
}
