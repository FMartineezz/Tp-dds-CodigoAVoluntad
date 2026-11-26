import { Logro } from "../models/logro.js";
import { AppError } from "../errors/appError.js";
import ErrorCatalog from "../errors/errorCatalog.js";

/** @typedef {import("../types.js").Id} Id */
/** @typedef {import("../types.js").LogroGuardado} LogroGuardado */

/**
 * Logros (hitos de avance) de un proyecto. La suma de sus porcentajes no puede pasar de 100
 * y no se modifican si el proyecto está finalizado.
 */
export class LogroService {
  /**
   * @param {object} deps
   * @param {import("./proyectoService.js").ProyectoService} deps.proyectoService
   * @param {import("../repositories/proyectoRepository.js").ProyectoRepository} deps.proyectoRepository
   */
  constructor({ proyectoService, proyectoRepository }) {
    this.proyectoService = proyectoService;
    this.proyectoRepository = proyectoRepository;
  }

  /**
   * Agrega un logro al proyecto.
   * @param {Id} proyectoId
   * @param {{ descripcion: string, porcentaje: number, urlCodigoFuente: string }} datos
   * @returns {Promise<LogroGuardado>}
   * @throws {AppError} 404 si no existe el proyecto; 400 si está finalizado o se pasaría del 100%.
   */
  async crearLogro(proyectoId, datos) {
    const proyecto = await this.proyectoService.obtenerProyectoPorId(proyectoId);

    if (proyecto.finalizado) {
      throw new AppError(ErrorCatalog.PROYECTO_FINALIZADO, 400, proyectoId);
    }

    const porcentajeActual = proyecto.logros.reduce((total, logro) => total + logro.porcentaje, 0);

    if (porcentajeActual + datos.porcentaje > 100) {
      throw new AppError(ErrorCatalog.PROYECTO_PORCENTAJE_MAXIMO, 400);
    }

    const logro = new Logro(datos.descripcion, datos.porcentaje, datos.urlCodigoFuente);

    return await this.proyectoRepository.guardarLogro(proyectoId, logro);
  }

  /**
   * @param {Id} proyectoId
   * @returns {Promise<LogroGuardado[]>}
   * @throws {AppError} 404 si no existe el proyecto.
   */
  async obtenerLogros(proyectoId) {
    await this.proyectoService.obtenerProyectoPorId(proyectoId);
    return await this.proyectoRepository.obtenerLogros(proyectoId);
  }

  /**
   * @param {Id} proyectoId
   * @param {Id} logroId
   * @returns {Promise<LogroGuardado>}
   * @throws {AppError} 404 si no existe el proyecto o el logro.
   */
  async obtenerLogroPorId(proyectoId, logroId) {
    await this.proyectoService.obtenerProyectoPorId(proyectoId);

    const logro = await this.proyectoRepository.obtenerLogroPorId(proyectoId, logroId);

    if (!logro) {
      throw new AppError(ErrorCatalog.PROYECTO_LOGRO_NO_ENCONTRADO, 404, logroId);
    }

    return logro;
  }

  /**
   * Modifica un logro, controlando que el total no pase del 100%.
   * @param {Id} proyectoId
   * @param {Id} logroId
   * @param {{ descripcion?: string, porcentaje?: number, urlCodigoFuente?: string }} cambios
   * @returns {Promise<LogroGuardado>} El logro actualizado.
   * @throws {AppError} 404 si no existe el proyecto o el logro; 400 si está finalizado o se
   *   pasaría del 100%.
   */
  async actualizarLogro(proyectoId, logroId, cambios) {
    const proyecto = await this.proyectoService.obtenerProyectoPorId(proyectoId);

    if (proyecto.finalizado) {
      throw new AppError(ErrorCatalog.PROYECTO_FINALIZADO, 400, proyectoId);
    }

    const logro = await this.obtenerLogroPorId(proyectoId, logroId);

    const porcentajeNuevo = cambios.porcentaje ?? logro.porcentaje;

    const porcentajeSinLogro =
      proyecto.logros.reduce((total, l) => total + l.porcentaje, 0) - logro.porcentaje;

    if (porcentajeSinLogro + porcentajeNuevo > 100) {
      throw new AppError(ErrorCatalog.PROYECTO_PORCENTAJE_MAXIMO, 400);
    }

    return await this.proyectoRepository.actualizarLogro(proyectoId, logroId, cambios);
  }

  /**
   * @param {Id} proyectoId
   * @param {Id} logroId
   * @returns {Promise<any>} Lo que devuelve el repositorio al borrar.
   * @throws {AppError} 404 si no existe el proyecto o el logro; 400 si está finalizado.
   */
  async eliminarLogro(proyectoId, logroId) {
    const proyecto = await this.proyectoService.obtenerProyectoPorId(proyectoId);

    if (proyecto.finalizado) {
      throw new AppError(ErrorCatalog.PROYECTO_FINALIZADO, 400, proyectoId);
    }

    await this.obtenerLogroPorId(proyectoId, logroId);

    return await this.proyectoRepository.eliminarLogro(proyectoId, logroId);
  }
}
