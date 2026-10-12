
import { Logro } from "../models/logro.js";
import { AppError } from "../errors/appError.js";
import ErrorCatalog from "../errors/errorCatalog.js";

export class LogroService {
  constructor({ proyectoService, proyectoRepository }) {
    this.proyectoService = proyectoService;
    this.proyectoRepository = proyectoRepository;
  }

  crearLogro(proyectoId, datos) {
    const proyecto =
      this.proyectoService.obtenerProyectoPorId(proyectoId);

    if (proyecto.finalizado) {
      throw new AppError(ErrorCatalog.PROYECTO_FINALIZADO, 400);
    }

    const porcentajeActual = proyecto.logros.reduce(
      (total, logro) => total + logro.porcentaje,
      0,
    );

    if (porcentajeActual + datos.porcentaje > 100) {
      throw new AppError(ErrorCatalog.PROYECYO_PORCENTAJE_MAXIMO, 400);
    }

    const logro = new Logro(
      datos.descripcion,
      datos.porcentaje,
      datos.urlCodigoFuente,
    );

    return this.proyectoRepository.guardarLogro(proyectoId, logro);
  }

  obtenerLogros(proyectoId) {
    this.proyectoService.obtenerProyectoPorId(proyectoId);
    return this.proyectoRepository.obtenerLogros(proyectoId);
  }

  obtenerLogroPorId(proyectoId, logroId) {
    this.proyectoService.obtenerProyectoPorId(proyectoId);

    const logro = this.proyectoRepository.obtenerLogroPorId(
      proyectoId,
      logroId,
    );

    if (!logro) {
      throw new AppError(ErrorCatalog.PROYECYO_LOGRO_INVALIDO, 404, logroId);
    }

    return logro;
  }

  actualizarLogro(proyectoId, logroId, cambios) {
    const proyecto =
      this.proyectoService.obtenerProyectoPorId(proyectoId);

    if (proyecto.finalizado) {
      throw new AppError(ErrorCatalog.PROYECTO_FINALIZADO, 400);
    }

    const logro = this.obtenerLogroPorId(proyectoId, logroId);

    const porcentajeNuevo = cambios.porcentaje ?? logro.porcentaje;

    const porcentajeSinLogro =
      proyecto.logros.reduce(
        (total, l) => total + l.porcentaje,
        0,
      ) - logro.porcentaje;

    if (porcentajeSinLogro + porcentajeNuevo > 100) {
      throw new AppError(ErrorCatalog.PROYECYO_PORCENTAJE_MAXIMO, 400);
    }

    return this.proyectoRepository.actualizarLogro(
      proyectoId,
      logroId,
      cambios,
    );
  }

  eliminarLogro(proyectoId, logroId) {
    const proyecto =
      this.proyectoService.obtenerProyectoPorId(proyectoId);

    if (proyecto.finalizado) {
      throw new AppError(ErrorCatalog.PROYECTO_FINALIZADO, 400);
    }

    this.obtenerLogroPorId(proyectoId, logroId);

    return this.proyectoRepository.eliminarLogro(
      proyectoId,
      logroId,
    );
  }
}
