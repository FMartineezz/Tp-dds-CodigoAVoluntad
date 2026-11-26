import { AppError } from "../errors/appError.js";
import ErrorCatalog from "../errors/errorCatalog.js";
import { Colectivo } from "../models/colectivo.js";
import { validarYNormalizarRedesSociales } from "./redSocialService.js";

/** @typedef {import("../types.js").Id} Id */
/** @typedef {import("../types.js").Paginacion} Paginacion */
/** @typedef {import("../types.js").ColectivoGuardado} ColectivoGuardado */
/**
 * @template T
 * @typedef {import("../types.js").Pagina<T>} Pagina
 */

/**
 * Alta, modificación, consulta y baja lógica de colectivos.
 */
export class ColectivoService {
  /**
   * @param {object} deps
   * @param {import("../repositories/colectivoRepository.js").ColectivoRepository} deps.repository
   */
  constructor({ repository }) {
    this.repository = repository;
  }

  /**
   * Crea un colectivo con nombre único, validando y normalizando sus redes sociales.
   * @param {string} nombre
   * @param {string} descripcion
   * @param {string | null} ubicacion
   * @param {ConstructorParameters<typeof Colectivo>[3]} tipoDeColectivo
   * @param {Id[]} [proyectos]
   * @param {object[]} [redesSociales] Redes sin validar, tal como llegan en el body.
   * @returns {Promise<Colectivo>} El colectivo con el `id` asignado y sin `denuncias`.
   * @throws {AppError} 400 si alguna red social es inválida; 409 si ya existe ese nombre.
   */
  async crearColectivo(
    nombre,
    descripcion,
    ubicacion,
    tipoDeColectivo,
    keycloackId,
    redesSociales = [],
  ) {
    const redesValidadas = validarYNormalizarRedesSociales(redesSociales) ?? [];

    const colectivo = await this.repository.obtenerPorNombre(nombre);

    if (colectivo) {
      throw new AppError(ErrorCatalog.COLECTIVO_YA_EXISTE, 409, nombre);
    }

    const nuevoColectivo = new Colectivo(
      nombre,
      descripcion,
      ubicacion,
      tipoDeColectivo,
      keycloackId,
      redesValidadas
    );

    const colectivoGuardado = await this.repository.guardar(nuevoColectivo);
    nuevoColectivo.id = colectivoGuardado.id;

    delete nuevoColectivo.denuncias;

    return nuevoColectivo;
  }

  /**
   * Aplica cambios parciales a un colectivo (las redes sociales se revalidan).
   * @param {Id} id
   * @param {{ redesSociales?: object[], [campo: string]: any }} [cambios]
   * @returns {Promise<ColectivoGuardado>} El colectivo actualizado.
   * @throws {AppError} 400 si no hay cambios o alguna red es inválida; 404 si no existe.
   */
  async actualizarColectivo(id, cambios = {}) {
    if (!cambios || Object.keys(cambios).length === 0) {
      throw new AppError(ErrorCatalog.ARGUMENTO_INVALIDO, 400);
    }

    const colectivo = await this.repository.obtenerPorId(id);
    if (!colectivo) {
      throw new AppError(ErrorCatalog.COLECTIVO_NO_ENCONTRADO, 404, id);
    }

    const cambiosPreparados = { ...cambios };

    if (cambios.redesSociales !== undefined) {
      cambiosPreparados.redesSociales = validarYNormalizarRedesSociales(cambios.redesSociales);
    }

    return await this.repository.actualizar(id, cambiosPreparados);
  }

  /**
   * Alias de {@link ColectivoService#actualizarColectivo}.
   * @param {Id} id
   * @param {{ redesSociales?: object[], [campo: string]: any }} cambios
   * @returns {Promise<ColectivoGuardado>}
   * @throws {AppError} 400 o 404, igual que actualizarColectivo.
   */
  async actualizar(id, cambios) {
    return await this.actualizarColectivo(id, cambios);
  }

  /**
   * Página de colectivos activos.
   * @param {Paginacion} paginacion
   * @returns {Promise<Pagina<ColectivoGuardado>>}
   */
  async obtenerColectivos(paginacion) {
    return await this.repository.obtenerPagina(paginacion);
  }

  /**
   * @param {Id} id
   * @returns {Promise<ColectivoGuardado>}
   * @throws {AppError} 404 si no existe.
   */
  async obtenerColectivoPorId(id) {
    const colectivo = await this.repository.obtenerPorId(id);

    if (!colectivo) {
      throw new AppError(ErrorCatalog.COLECTIVO_NO_ENCONTRADO, 404, id);
    }

    return colectivo;
  }

  /**
   * @param {string} nombre
   * @returns {Promise<ColectivoGuardado>}
   * @throws {AppError} 400 si no existe un colectivo con ese nombre.
   */
  async obtenerColectivoPorNombre(nombre) {
    const colectivo = await this.repository.obtenerPorNombre(nombre);

    if (!colectivo) {
      throw new AppError(ErrorCatalog.COLECTIVO_NO_ENCONTRADO_POR_NOMBRE, 400, nombre);
    }

    return colectivo;
  }

  /**
   * Suma un proyecto a la lista de proyectos del colectivo.
   * @param {Id} colectivoId
   * @param {Id} proyectoId
   * @returns {Promise<void>}
   */
  async agregarProyecto(colectivoId, proyectoId) {
    const colectivo = await this.repository.obtenerPorId(colectivoId);
    colectivo.proyectos.push(proyectoId);
    await this.repository.agregarProyecto(colectivoId, proyectoId);
  }

  // Baja lógica: el colectivo deja de listarse pero su historial se conserva
  /**
   * @param {Id} id
   * @returns {Promise<void>}
   * @throws {AppError} 404 si no existe; 409 si ya estaba dado de baja.
   */
  async eliminarColectivo(id) {
    const colectivo = await this.repository.obtenerPorIdConEstado(id);

    if (!colectivo) {
      throw new AppError(ErrorCatalog.COLECTIVO_NO_ENCONTRADO, 404, id);
    }

    if (colectivo.activo === false) {
      throw new AppError(ErrorCatalog.COLECTIVO_YA_DADO_DE_BAJA, 409, id);
    }

    await this.repository.eliminarColectivo(id);
  }

  //Estadisticas
  /**
   * Total de colectivos activos y cuántos hay por ubicación.
   * @returns {Promise<{ total: number, porUbicacion: { ubicacion: string, cantidad: number }[] }>}
   */
  async obtenerEstadisticas() {
    const porUbicacion = await this.repository.contarPorUbicacion();
    const total = porUbicacion.reduce((suma, grupo) => suma + grupo.cantidad, 0);

    return { total, porUbicacion };
  }
}
