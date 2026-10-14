import { Logro } from "../models/logro.js";
import { AppError } from "../errors/appError.js";
import ErrorCatalog from "../errors/errorCatalog.js";

export class LogroService {
  constructor({ proyectoService, proyectoRepository }) {
    this.proyectoService = proyectoService;
    this.proyectoRepository = proyectoRepository;
  }

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

  async obtenerLogros(proyectoId) {
    await this.proyectoService.obtenerProyectoPorId(proyectoId);
    return await this.proyectoRepository.obtenerLogros(proyectoId);
  }

  async obtenerLogroPorId(proyectoId, logroId) {
    await this.proyectoService.obtenerProyectoPorId(proyectoId);

    const logro = await this.proyectoRepository.obtenerLogroPorId(proyectoId, logroId);

    if (!logro) {
      throw new AppError(ErrorCatalog.PROYECTO_LOGRO_NO_ENCONTRADO, 404, logroId);
    }

    return logro;
  }

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

  async eliminarLogro(proyectoId, logroId) {
    const proyecto = await this.proyectoService.obtenerProyectoPorId(proyectoId);

    if (proyecto.finalizado) {
      throw new AppError(ErrorCatalog.PROYECTO_FINALIZADO, 400, proyectoId);
    }

    await this.obtenerLogroPorId(proyectoId, logroId);

    return await this.proyectoRepository.eliminarLogro(proyectoId, logroId);
  }
}
