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
    habilidad.id = habilidadGuardada.id;

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
      throw new AppError(ErrorCatalog.HABILIDADES_INEXISTENTES_GENERICO, 400, codigo);
    }
    return habilidad;
  }

  async obtenerHabilidadesPorCodigos(codigos) {
    return await this.repository.obtenerPorCodigos(codigos);
  }

  /**
   * Busca varias habilidades con UNA sola consulta (`$in`) y las devuelve en un Map
   * código → habilidad. Es la forma de evitar consultas N+1: no se hace un findOne por código.
   *
   * @param {string[]} codigos Códigos de habilidad; puede tener repetidos.
   * @returns {Promise<Map<string, HabilidadGuardada>>}
   * @throws {AppError} 400 con la lista de códigos que no existen.
   */
  async obtenerMapaPorCodigos(codigos) {
    const unicos = [...new Set(codigos)];
    const encontradas = await this.repository.obtenerPorCodigos(unicos);
    const mapa = new Map(encontradas.map((habilidad) => [habilidad.codigo, habilidad]));

    const noEncontrados = unicos.filter((codigo) => !mapa.has(codigo));
    if (noEncontrados.length > 0) {
      throw new AppError(ErrorCatalog.HABILIDADES_INEXISTENTES_GENERICO, 400, noEncontrados);
    }
    return mapa;
  }
}
