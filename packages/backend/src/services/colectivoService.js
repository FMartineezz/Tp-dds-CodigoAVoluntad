import { AppError } from "../errors/appError.js";
import ErrorCatalog from "../errors/errorCatalog.js";
import { Colectivo } from "../models/colectivo.js";
import { TipoColectivo } from "../models/colectivo.js";

export class ColectivoService {
  constructor({ repository }) {
    this.repository = repository;
  }

  async crearColectivo(nombre, descripcion, ubIcacion, tipoDeColectivo, proyectos) {
    const colectivo = await this.repository.obtenerColectivoPorNombre(nombre);

    if (colectivo) {
      throw new AppError(ErrorCatalog.COLECTIVO_YA_EXISTE, 409, nombre);
    }

    const nuevoColectivo = new Colectivo(
      nombre,
      descripcion,
      ubIcacion,
      tipoDeColectivo,
      proyectos,
    );
    await this.repository.guardar(nuevoColectivo);

    return nuevoColectivo;
  }

  async obtenerColectivos() {
    return await this.repository.obtenerTodos();
  }

  async obtenerColectivoPorId(id) {
    const colectivo = await this.repository.obtenerPorId(id);

    if (!colectivo) {
      throw new AppError(ErrorCatalog.COLECTIVO_NO_ENCONTRADO, 404, id);
    }

    return colectivo;
  }

  async obtenerColectivoPorNombre(nombre) {
    const colectivo = await this.repository.obtenerPorNombre(nombre);

    if (!colectivo) {
      throw new AppError(ErrorCatalog.COLECTIVO_NO_ENCONTRADO_POR_NOMBRE, 400, nombre);
    }

    return colectivo;
  }

  //CAMBIAR ESTO PARA PERSISTIRLO
  agregarProyecto(colectivo, proyecto) {
    colectivo.proyectos.push(proyecto.id);
  }
}
