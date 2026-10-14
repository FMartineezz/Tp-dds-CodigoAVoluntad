import { AppError } from "../errors/appError.js";
import ErrorCatalog from "../errors/errorCatalog.js";
import { Habilidad } from "../models/habilidad.js";

export class HabilidadService {
  constructor({ repository }) {
    this.repository = repository;
  }

  async crearHabilidad(titulo, descripcion) {
    //Valido que no exista la habilidad
    const habilidadExistente = await this.repository.obtenerPorTitulo(titulo);
    if (habilidadExistente) {
      throw new AppError(ErrorCatalog.HABILIDAD_YA_EXISTE, 409, habilidadExistente._id);
    }

    const habilidad = new Habilidad(titulo, descripcion);
    const habilidadGuardada = await this.repository.guardar(habilidad);
    habilidad.id = habilidadGuardada;

    return habilidad;
  }

  async obtenerHabilidades() {
    return await this.repository.obtenerTodas();
  }

  async obtenerHabilidadPorId(id) {
    const habilidad = await this.repository.obtenerPorId(id);

    if (!habilidad) {
      throw new AppError(ErrorCatalog.HABILIDAD_NO_ENCONTRADA_POR_ID, 404, id);
    }

    return habilidad;
  }

  async obtenerHabilidadPorCodigo(codigo) {
    const habilidad = await this.repository.obtenerPorCodigo(codigo);

    if (!habilidad) {
      throw new AppError(ErrorCatalog.HABILIDAD_INEXISTENTE_GENERICO, 400, codigo);
    }
    return habilidad;
  }

  async obtenerHabilidadesPorCodigos(codigos) {
    return await this.habilidadRepository.obtenerHabilidadesPorCodigos(codigos);
  }
}
