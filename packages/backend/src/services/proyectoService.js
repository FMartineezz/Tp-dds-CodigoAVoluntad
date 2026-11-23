import { Proyecto } from "../models/proyecto.js";
import { AppError } from "../errors/appError.js";
import ErrorCatalog from "../errors/errorCatalog.js";
import { eventos, EVENTO_PROYECTO_CREADO, EVENTO_PROYECTOS_CERRADOS } from "../events/events.js";

/** @typedef {import("../types.js").Id} Id */
/** @typedef {import("../types.js").Paginacion} Paginacion */
/** @typedef {import("../types.js").ProyectoGuardado} ProyectoGuardado */
/** @typedef {import("../types.js").PerfilGuardado} PerfilGuardado */
/** @typedef {import("./perfilService.js").DatosDePerfil} DatosDePerfil */

/**
 * Cambios que acepta el PATCH de proyecto (cualquier otro campo da 400).
 * @typedef {object} CambiosDeProyecto
 * @property {boolean} [finalizado] Solo se acepta `true` (finalizar).
 * @property {Date | string | null} [fechaCierre] null o vacío la borra.
 * @property {string | null} [urlDonaciones] null o "" la borra.
 */

/**
 * Lo que efectivamente se manda al repositorio en el PATCH de proyecto.
 * @typedef {object} ActualizacionesDeProyecto
 * @property {true} [finalizado]
 * @property {Date | null} [fechaCierre]
 * @property {string | null} [urlDonaciones]
 */

/**
 * Estadísticas generales de proyectos.
 * @typedef {object} EstadisticasDeProyectos
 * @property {number} total
 * @property {number} activos
 * @property {number} finalizados
 */

/**
 * Proyectos de los colectivos y sus perfiles: alta, consulta, actualización y cierre.
 */
export class ProyectoService {
  /**
   * @param {object} deps
   * @param {import("../repositories/proyectoRepository.js").ProyectoRepository} deps.proyectoRepository
   * @param {import("./perfilService.js").PerfilService} deps.perfilService
   * @param {import("./colectivoService.js").ColectivoService} deps.colectivoService
   */
  constructor({ proyectoRepository, perfilService, colectivoService }) {
    this.proyectoRepository = proyectoRepository;
    this.perfilService = perfilService;
    this.colectivoService = colectivoService;
  }

  /**
   * Indica si `url` es una URL http o https bien formada.
   * @param {unknown} url
   * @returns {boolean}
   */
  validarUrlHttp(url) {
    if (!url || typeof url !== "string") return false;
    try {
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }

  /**
   * Crea un proyecto con sus perfiles, lo agrega al colectivo y emite EVENTO_PROYECTO_CREADO
   * (dispara notificaciones).
   * @param {string} titulo
   * @param {string} descripcion
   * @param {DatosDePerfil[]} perfiles
   * @param {string} colectivo NOMBRE del colectivo.
   * @param {string} urlSistema
   * @param {Date} [fechaCierre]
   * @param {Date} [fechaLimiteBusqueda]
   * @param {string | null} [urlDonaciones]
   * @returns {Promise<ProyectoGuardado>}
   * @throws {AppError} 404 si el colectivo no existe; 409 si ya tiene un proyecto con ese
   *   título; 400 si la URL de donaciones o algún código de habilidad es inválido.
   */
  async crearProyecto(
    titulo,
    descripcion,
    perfiles,
    colectivo,
    urlSistema,
    fechaCierre,
    fechaLimiteBusqueda,
    urlDonaciones,
  ) {
    //en vez de nombre, usar id
    const colectivoEncontrado = await this.colectivoService.obtenerColectivoPorNombre(colectivo);

    const proyecto = await this.proyectoRepository.obtenerPorTituloYColectivo(
      titulo,
      colectivoEncontrado._id,
    );

    if (proyecto) {
      throw new AppError(
        ErrorCatalog.PROYECTO_YA_EXISTENTE,
        409,
        proyecto.titulo,
        colectivoEncontrado.nombre,
      );
    }

    if (urlDonaciones !== undefined && urlDonaciones !== null && urlDonaciones !== "") {
      if (!this.validarUrlHttp(urlDonaciones)) {
        throw new AppError(ErrorCatalog.PROYECTO_URL_DONACIONES_INVALIDA, 400);
      }
    }

    // Todos los perfiles se arman con UNA consulta de habilidades (no una por perfil)
    const perfilesCreados = await this.perfilService.crearPerfiles(perfiles);

    const urlDonacionesFinal = urlDonaciones && urlDonaciones !== "" ? urlDonaciones : null;

    const proyectoNuevo = new Proyecto(
      titulo,
      descripcion,
      perfilesCreados,
      colectivoEncontrado,
      urlSistema,
      fechaCierre,
      fechaLimiteBusqueda,
      urlDonacionesFinal,
    );
    const proyectoGuardado = await this.proyectoRepository.guardar(proyectoNuevo);
    proyectoNuevo.id = proyectoGuardado.id;

    await this.colectivoService.agregarProyecto(colectivoEncontrado._id, proyectoGuardado._id);

    eventos.emit(EVENTO_PROYECTO_CREADO, proyectoGuardado, colectivo);

    return proyectoGuardado;
  }

  /**
   * Página de proyectos.
   * @param {Paginacion} paginacion
   * @returns {Promise<import("../types.js").Pagina<ProyectoGuardado>>}
   */
  async obtenerProyectos(paginacion) {
    return await this.proyectoRepository.obtenerPagina(paginacion);
  }

  // Lanza 404 si el colectivo no existe (o fue dado de baja)
  /**
   * Página de proyectos de un colectivo.
   * @param {Id} colectivoId
   * @param {Paginacion} paginacion
   * @returns {Promise<import("../types.js").Pagina<ProyectoGuardado>>}
   * @throws {AppError} 404 si el colectivo no existe.
   */
  async obtenerProyectosDeColectivo(colectivoId, paginacion) {
    await this.colectivoService.obtenerColectivoPorId(colectivoId);
    return await this.proyectoRepository.obtenerPaginaDeColectivo(colectivoId, paginacion);
  }

  /**
   * @param {Id} id
   * @returns {Promise<ProyectoGuardado>}
   * @throws {AppError} 404 si el proyecto no existe.
   */
  async obtenerProyectoPorId(id) {
    const proyecto = await this.proyectoRepository.obtenerPorId(id);

    if (!proyecto) {
      throw new AppError(ErrorCatalog.PROYECTO_NO_ENCONTRADO, 404, id);
    }

    return proyecto;
  }

  /**
   * Proyectos no finalizados con algún perfil que requiera alguna de las habilidades (sin
   * paginar, con el colectivo populado).
   * @param {Id[]} idsHabilidad
   * @returns {Promise<ProyectoGuardado[]>}
   */
  async obtenerProyectosConAlgunaHabilidad(idsHabilidad) {
    const proyectos = await this.proyectoRepository.obtenerPorAlgunaHabilidad(idsHabilidad);
    return proyectos;
  }

  /**
   * Versión paginada de {@link ProyectoService#obtenerProyectosConAlgunaHabilidad}; además
   * deja afuera los proyectos con la búsqueda cerrada o vencida.
   * @param {Id[]} idsHabilidad
   * @param {Paginacion} paginacion
   * @returns {Promise<import("../types.js").Pagina<ProyectoGuardado>>}
   */
  async obtenerPaginaDeProyectosConAlgunaHabilidad(idsHabilidad, paginacion) {
    return await this.proyectoRepository.obtenerPaginaPorAlgunaHabilidad(idsHabilidad, paginacion);
  }

  /**
   * Finaliza un proyecto y emite EVENTO_PROYECTOS_CERRADOS.
   * @param {Id} id
   * @returns {Promise<ProyectoGuardado>} El proyecto actualizado.
   * @throws {AppError} 404 si no existe; 400 si ya estaba finalizado.
   */
  async finalizarProyecto(id) {
    const proyecto = await this.proyectoRepository.obtenerPorId(id);

    if (!proyecto) {
      throw new AppError(ErrorCatalog.PROYECTO_NO_ENCONTRADO, 404, id);
    }

    if (proyecto.finalizado) {
      throw new AppError(ErrorCatalog.PROYECTO_FINALIZADO, 400, id);
    }

    const finalizado = await this.proyectoRepository.finalizarProyecto(id);
    eventos.emit(EVENTO_PROYECTOS_CERRADOS, [id]);

    return finalizado;
  }

  /**
   * Aplica un PATCH al proyecto (solo finalizado, fechaCierre y urlDonaciones). Si lo
   * finaliza, emite EVENTO_PROYECTOS_CERRADOS.
   * @param {Id} id
   * @param {CambiosDeProyecto} [cambios]
   * @returns {Promise<ProyectoGuardado>} El proyecto actualizado.
   * @throws {AppError} 400 si los cambios están vacíos, tienen campos no permitidos o valores
   *   inválidos, o si ya estaba finalizado; 404 si el proyecto no existe.
   */
  async actualizarProyecto(id, cambios = {}) {
    if (!cambios || typeof cambios !== "object" || Array.isArray(cambios)) {
      throw new AppError(ErrorCatalog.ARGUMENTO_INVALIDO, 400);
    }

    const campos = Object.keys(cambios);
    if (campos.length === 0) {
      throw new AppError(ErrorCatalog.ARGUMENTO_INVALIDO, 400);
    }

    const camposPermitidos = ["finalizado", "fechaCierre", "urlDonaciones"];
    const tieneCamposNoPermitidos = campos.some((campo) => !camposPermitidos.includes(campo));
    if (tieneCamposNoPermitidos) {
      throw new AppError(ErrorCatalog.ARGUMENTO_INVALIDO, 400);
    }

    const proyecto = await this.proyectoRepository.obtenerPorId(id);
    if (!proyecto) {
      throw new AppError(ErrorCatalog.PROYECTO_NO_ENCONTRADO, 404, id);
    }

    /** @type {ActualizacionesDeProyecto} */
    const actualizaciones = {};

    if (cambios.finalizado !== undefined) {
      if (cambios.finalizado !== true) {
        throw new AppError(ErrorCatalog.ARGUMENTO_INVALIDO, 400);
      }
      if (proyecto.finalizado) {
        throw new AppError(ErrorCatalog.PROYECTO_FINALIZADO, 400, id);
      }
      actualizaciones.finalizado = true;
    }

    if (cambios.fechaCierre !== undefined) {
      actualizaciones.fechaCierre = cambios.fechaCierre ? new Date(cambios.fechaCierre) : null;
    }

    if (cambios.urlDonaciones !== undefined) {
      if (cambios.urlDonaciones === null || cambios.urlDonaciones === "") {
        actualizaciones.urlDonaciones = null;
      } else if (typeof cambios.urlDonaciones === "string") {
        if (!this.validarUrlHttp(cambios.urlDonaciones)) {
          throw new AppError(ErrorCatalog.PROYECTO_URL_DONACIONES_INVALIDA, 400);
        }
        actualizaciones.urlDonaciones = cambios.urlDonaciones;
      } else {
        throw new AppError(ErrorCatalog.PROYECTO_URL_DONACIONES_INVALIDA, 400);
      }
    }

    const proyectoActualizado = await this.proyectoRepository.actualizarProyecto(
      id,
      actualizaciones,
    );

    if (actualizaciones.finalizado) {
      eventos.emit(EVENTO_PROYECTOS_CERRADOS, [id]);
    }

    return proyectoActualizado;
  }

  /**
   * Agrega un perfil nuevo al proyecto.
   * @param {Id} proyectoId
   * @param {string} descripcion
   * @param {string[]} habilidadesRequeridas Códigos de habilidad.
   * @param {string[]} habilidadesOpcionales Códigos de habilidad.
   * @param {number} horas
   * @param {import("../models/proyecto.js").TipoCompromisoValor} tipoDeCompromiso
   * @param {import("../models/proyecto.js").ModalidadColaboracionValor} modalidadDeColaboracion
   * @param {number} [cantidadMaxima]
   * @returns {Promise<PerfilGuardado | null>} El perfil guardado; null si el proyecto no existe.
   * @throws {AppError} 400 si algún código de habilidad no existe.
   */
  async agregarPerfil(
    proyectoId,
    descripcion,
    habilidadesRequeridas,
    habilidadesOpcionales,
    horas,
    tipoDeCompromiso,
    modalidadDeColaboracion,
    cantidadMaxima,
  ) {
    const perfil = await this.perfilService.crearPerfil(
      descripcion,
      habilidadesRequeridas,
      habilidadesOpcionales,
      horas,
      tipoDeCompromiso,
      modalidadDeColaboracion,
      cantidadMaxima,
    );

    return await this.proyectoRepository.guardarPerfil(proyectoId, perfil);
  }

  /**
   * @param {Id} proyectoId
   * @returns {Promise<ProyectoGuardado["perfiles"]>}
   * @throws {AppError} 404 si el proyecto no existe.
   */
  async obtenerPerfiles(proyectoId) {
    const proyecto = await this.obtenerProyectoPorId(proyectoId);
    return proyecto.perfiles;
  }

  /**
   * @param {Id} proyectoId
   * @param {Id} perfilId
   * @returns {Promise<PerfilGuardado>}
   * @throws {AppError} 404 si no existe el proyecto o el perfil.
   */
  async obtenerPerfilPorId(proyectoId, perfilId) {
    await this.obtenerProyectoPorId(proyectoId);
    const perfil = await this.proyectoRepository.obtenerPerfilPorId(proyectoId, perfilId);
    if (!perfil) {
      throw new AppError(ErrorCatalog.PERFIL_NO_ENCONTRADO, 404, perfilId);
    }
    return perfil;
  }

  /**
   * Aplica un PATCH a un perfil del proyecto (habilidades por código).
   * @param {Id} proyectoId
   * @param {Id} perfilId
   * @param {Partial<DatosDePerfil>} cambios
   * @returns {Promise<PerfilGuardado | null>} El perfil actualizado.
   * @throws {AppError} 404 si no existe el proyecto o el perfil; 400 si algún código de
   *   habilidad no existe.
   */
  async actualizarPerfil(proyectoId, perfilId, cambios) {
    await this.obtenerProyectoPorId(proyectoId);
    await this.obtenerPerfilPorId(proyectoId, perfilId);

    const cambiosPreparados = await this.perfilService.prepararCambios(cambios);

    return await this.proyectoRepository.actualizarPerfil(proyectoId, perfilId, cambiosPreparados);
  }

  /**
   * Quita un perfil del proyecto.
   * @param {Id} proyectoId
   * @param {Id} perfilId
   * @returns {Promise<PerfilGuardado | null>} El perfil eliminado.
   * @throws {AppError} 404 si no existe el proyecto o el perfil.
   */
  async eliminarPerfil(proyectoId, perfilId) {
    await this.obtenerProyectoPorId(proyectoId);
    await this.obtenerPerfilPorId(proyectoId, perfilId);

    return await this.proyectoRepository.eliminarPerfil(proyectoId, perfilId);
  }

  /**
   * Finaliza los proyectos cuya fechaCierre ya pasó y emite EVENTO_PROYECTOS_CERRADOS con
   * sus ids (lo usa el job de cierre automático).
   * @param {Date} fechaActual
   * @returns {Promise<void>}
   */
  async cerrarProyectosSi(fechaActual) {
    const idsCerrados = await this.proyectoRepository.cerrarProyectoSi(fechaActual);
    if (idsCerrados && idsCerrados.length > 0) {
      eventos.emit(EVENTO_PROYECTOS_CERRADOS, idsCerrados);
    }
  }

  /**
   * Indica si el proyecto acepta postulaciones: búsqueda no cerrada y fecha límite no vencida.
   * @param {Pick<ProyectoGuardado, "busquedaCerrada" | "fechaLimiteBusqueda">} proyecto
   * @returns {boolean}
   */
  estaBusquedaAbierta(proyecto) {
    if (proyecto.busquedaCerrada === true) return false;
    if (proyecto.fechaLimiteBusqueda && new Date(proyecto.fechaLimiteBusqueda) < new Date()) {
      return false;
    }
    return true;
  }

  //Estadisticas
  /**
   * Totales de proyectos (todo en 0 si no hay ninguno).
   * @returns {Promise<EstadisticasDeProyectos>}
   */
  async obtenerEstadisticas() {
    const resultado = await this.proyectoRepository.contarTotalYActicvos();
    const { total, activos } = resultado[0] ?? { total: 0, activos: 0 };

    return { total, activos, finalizados: total - activos };
  }
}
