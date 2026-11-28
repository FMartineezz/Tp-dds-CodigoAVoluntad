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
      redesValidadas,
    );

    const colectivoGuardado = await this.repository.guardar(nuevoColectivo);
    nuevoColectivo.id = colectivoGuardado.id;

    delete nuevoColectivo.denuncias;

    return nuevoColectivo;
  }
  //No se permite admin a no ser que se diga lo contrario
  exigirPermiso(id, cuenta, { permitirAdmin = false } = {}) {
    if (!cuenta) return;
    if (permitirAdmin && cuenta.tipo == "adm") return;
    if (String(cuenta.id) !== String(id)) {
      throw new AppError("Acceso denegado: no sos dueño de este colectivo", 403);
    }
  }

  /**
   * Aplica cambios parciales a un colectivo (las redes sociales se revalidan).
   * @param {Id} id
   * @param {{ redesSociales?: object[], [campo: string]: any }} [cambios]
   * @returns {Promise<ColectivoGuardado>} El colectivo actualizado.
   * @throws {AppError} 400 si no hay cambios o alguna red es inválida; 404 si no existe.
   */
  async actualizarColectivo(id, cambios = {}, cuenta) {
    this.exigirPermiso(id, cuenta);
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
   * Colectivos dados de baja (para el equipo administrativo).
   * @returns {Promise<ColectivoGuardado[]>}
   */
  async obtenerDadosDeBaja() {
    return await this.repository.obtenerDadosDeBaja();
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

  // ───── Foto de perfil subida ─────

  /**
   * Guarda (o reemplaza) la foto subida.
   * @param {Id} id
   * @param {{ datos: Buffer, tipo: string }} foto
   * @returns {Promise<{ fotoSubida: Date }>}
   * @throws {AppError} 404 si el colectivo no existe o está dado/a de baja.
   */
  async subirFoto(id, foto, cuenta) {
    this.exigirPermiso(id, cuenta);
    const resultado = await this.repository.guardarFoto(id, foto);
    if (!resultado) throw new AppError(ErrorCatalog.COLECTIVO_NO_ENCONTRADO, 404, id);
    return { fotoSubida: resultado.fotoSubida };
  }

  /**
   * @param {Id} id
   * @returns {Promise<{ datos: Buffer, tipo: string }>}
   * @throws {AppError} 404 si el colectivo no existe o si no subió ninguna foto.
   */
  async obtenerFoto(id) {
    const cuenta = await this.repository.obtenerFoto(id);
    if (!cuenta) throw new AppError(ErrorCatalog.COLECTIVO_NO_ENCONTRADO, 404, id);
    if (!cuenta.fotoArchivo) throw new AppError(ErrorCatalog.FOTO_NO_ENCONTRADA, 404, id);
    return cuenta.fotoArchivo;
  }

  /**
   * Borra la foto subida (si no tenía, no pasa nada).
   * @param {Id} id
   * @returns {Promise<void>}
   * @throws {AppError} 404 si el colectivo no existe o está dado/a de baja.
   */
  async borrarFoto(id, cuenta) {
    this.exigirPermiso(id, cuenta);
    const resultado = await this.repository.borrarFoto(id);
    if (!resultado) throw new AppError(ErrorCatalog.COLECTIVO_NO_ENCONTRADO, 404, id);
  }

  // Baja lógica: el colectivo deja de listarse pero su historial se conserva
  /**
   * @param {Id} id
   * @returns {Promise<void>}
   * @throws {AppError} 404 si no existe; 409 si ya estaba dado de baja.
   */
  async eliminarColectivo(id, cuenta) {
    this.exigirPermiso(id, cuenta, { permitirAdmin: true });
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
