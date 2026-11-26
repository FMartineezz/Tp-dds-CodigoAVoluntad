import { HabilidadModel } from "../schemas/habilidadSchema.js";

/** @typedef {import("../types.js").HabilidadGuardada} HabilidadGuardada */
/** @typedef {import("../models/habilidad.js").Habilidad} Habilidad */

/** Acceso a la colección de habilidades (las precarga el equipo administrativo). */
export class HabilidadRespository {
  constructor() {
    this.model = HabilidadModel;
  }

  /**
   * Guarda una habilidad nueva.
   * @param {Habilidad} habilidad
   * @returns {Promise<import("mongoose").Document & HabilidadGuardada>} El documento de mongoose (sin lean).
   */
  async guardar(habilidad) {
    const nuevaHabilidad = new this.model(habilidad);
    return await nuevaHabilidad.save();
  }

  /**
   * Trae todas las habilidades.
   * @returns {Promise<HabilidadGuardada[]>}
   */
  async obtenerTodas() {
    return await this.model.find().lean();
  }

  /**
   * Busca una habilidad por id.
   * @param {import("../types.js").Id} id
   * @returns {Promise<HabilidadGuardada | null>}
   */
  async obtenerPorId(id) {
    return await this.model.findById(id).lean();
  }

  /**
   * Busca una habilidad por título exacto.
   * @param {string} titulo
   * @returns {Promise<HabilidadGuardada | null>}
   */
  async obtenerPorTitulo(titulo) {
    return await this.model.findOne({ titulo }).lean();
  }

  /**
   * Busca una habilidad por código (título en snake_case).
   * @param {string} codigo
   * @returns {Promise<HabilidadGuardada | null>}
   */
  async obtenerPorCodigo(codigo) {
    return await this.model.findOne({ codigo }).lean();
  }

  /**
   * Trae las habilidades cuyos códigos estén en la lista.
   * @param {string[]} codigos
   * @returns {Promise<HabilidadGuardada[]>}
   */
  async obtenerPorCodigos(codigos) {
    return await this.model.find({ codigo: { $in: codigos } }).lean();
  }
}
