import { AppError } from "../errors/appError.js";
import ErrorCatalog from "../errors/errorCatalog.js";
import { Habilidad } from "../models/habilidad.js";

export class HabilidadService {
  constructor({ repository }) {
    this.repository = repository;
  }

  crearHabilidad(titulo, descripcion) {
    //Valido que no exista la habilidad
    const habilidadExistente = this.repository.obtenerPorTitulo(titulo);
    if (habilidadExistente) {
      throw new AppError(ErrorCatalog.HABILIDAD_YA_EXISTE, 409, habilidadExistente.id);
    }

    const habilidad = new Habilidad(titulo, descripcion);
    this.repository.guardar(habilidad);
    return habilidad;
  }

  obtenerHabilidades() {
    return this.repository.obtenerTodas();
  }

  obtenerHabilidadPorId(id) {
    const habilidad = this.repository.obtenerPorId(id);

    if (!habilidad) {
      throw new AppError(ErrorCatalog.HABILIDAD_NO_ENCONTRADA_POR_ID, 404, id);
    }

    return habilidad;
  }

  obtenerHabilidadPorCodigo(codigo) {
    const habilidad = this.repository.obtenerPorCodigo(codigo);

    if (!habilidad) {
      throw new AppError(ErrorCatalog.HABILIDAD_INEXISTENTE_GENERICO, 400, codigo);
    }
    return habilidad;
  }
}
