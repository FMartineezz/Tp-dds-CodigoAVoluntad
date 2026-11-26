import mongoose from "mongoose";
import { ColectivoModel } from "../schemas/colectivoSchema.js";
import { paginar } from "./paginar.js";

/** @typedef {import("../types.js").Id} Id */
/** @typedef {import("../types.js").ColectivoGuardado} ColectivoGuardado */
/** @typedef {import("../types.js").DenunciaGuardada} DenunciaGuardada */
/** @typedef {import("../models/colectivo.js").Colectivo} Colectivo */
/** @typedef {import("../models/denuncia.js").Denuncia} Denuncia */
/** @typedef {typeof import("../models/denuncia.js").EstadoDenuncia[keyof typeof import("../models/denuncia.js").EstadoDenuncia]} EstadoDenunciaValor */

/**
 * Denuncia junto con los datos del colectivo denunciado.
 * @typedef {DenunciaGuardada & { colectivoId: import("mongoose").Types.ObjectId, colectivoNombre: string }} DenunciaConColectivo
 */

/** Acceso a la colección de colectivos (y sus denuncias, que viven embebidas). */
export class ColectivoRepository {
  constructor() {
    this.model = ColectivoModel;
  }

  /**
   * Guarda un colectivo nuevo.
   * @param {Colectivo} colectivo
   * @returns {Promise<import("mongoose").Document & ColectivoGuardado>} El documento de mongoose (sin lean).
   */
  async guardar(colectivo) {
    const nuevoColectivo = new this.model(colectivo);
    return await nuevoColectivo.save();
  }

  /**
   * Colectivos activos.
   * @returns {Promise<ColectivoGuardado[]>}
   */
  async obtenerTodos() {
    return await this.model.find({ activo: true }).lean();
  }

  /**
   * Una página de colectivos activos.
   * @param {import("../types.js").Paginacion} paginacion
   * @returns {Promise<import("../types.js").Pagina<ColectivoGuardado>>}
   */
  async obtenerPagina(paginacion) {
    return await paginar(this.model, { activo: true }, paginacion);
  }

  /**
   * Colectivos dados de baja, los últimos primero. `updatedAt` dice cuándo fue la baja
   * (después de la baja ya no se modifican).
   * @returns {Promise<ColectivoGuardado[]>}
   */
  async obtenerDadosDeBaja() {
    return await this.model.find({ activo: false }).select("+updatedAt").sort({ updatedAt: -1, _id: -1 }).lean();
  }

  /**
   * Todos los colectivos, también los dados de baja.
   * @returns {Promise<ColectivoGuardado[]>}
   */
  async obtenerTodosConEliminados() {
    return await this.model.find().lean();
  }

  /**
   * Busca un colectivo por id (sin el campo `activo`).
   * @param {Id} id
   * @returns {Promise<ColectivoGuardado | null>}
   */
  async obtenerPorId(id) {
    return await this.model.findById(id).lean();
  }

  // Igual que obtenerPorId pero trae `activo` (que por defecto no se lee: select false)
  /**
   * @param {Id} id
   * @returns {Promise<ColectivoGuardado | null>}
   */
  async obtenerPorIdConEstado(id) {
    return await this.model.findById(id).select("+activo").lean();
  }

  /**
   * Busca un colectivo por nombre exacto.
   * @param {string} nombre
   * @returns {Promise<ColectivoGuardado | null>}
   */
  async obtenerPorNombre(nombre) {
    return await this.model.findOne({ nombre }).lean();
  }

  /**
   * Agrega un proyecto a la lista del colectivo.
   * @param {Id} colectivoId
   * @param {Id} proyecto Id del proyecto.
   * @returns {Promise<(import("mongoose").Document & ColectivoGuardado) | null>} El documento
   *   ANTES del cambio (sin `new: true` ni lean), o null si no existe.
   */
  async agregarProyecto(colectivoId, proyecto) {
    return await this.model.findByIdAndUpdate(colectivoId, {
      $push: {
        proyectos: proyecto,
      },
    });
  }

  // ───── Foto de perfil subida ─────

  /**
   * Guarda la foto subida de un colectivo activo/a y anota cuándo se subió.
   * @param {Id} id
   * @param {{ datos: Buffer, tipo: string }} foto
   * @returns {Promise<{ fotoSubida: Date } | null>} null si no existe o está dado/a de baja.
   */
  async guardarFoto(id, foto) {
    return await this.model
      .findOneAndUpdate(
        { _id: id, activo: true },
        { $set: { fotoArchivo: foto, fotoSubida: new Date() } },
        { returnDocument: "after", projection: { fotoSubida: 1 } },
      )
      .lean();
  }

  /**
   * Trae la foto subida (sin lean, para que `datos` llegue como Buffer).
   * @param {Id} id
   * @returns {Promise<{ fotoArchivo?: { datos: Buffer, tipo: string } } | null>} null si no existe
   *   o está dado/a de baja; sin `fotoArchivo` si nunca subió una.
   */
  async obtenerFoto(id) {
    return await this.model.findOne({ _id: id, activo: true }, { fotoArchivo: 1 }).select("+fotoArchivo");
  }

  /**
   * Borra la foto subida.
   * @param {Id} id
   * @returns {Promise<object | null>} null si no existe o está dado/a de baja.
   */
  async borrarFoto(id) {
    return await this.model
      .findOneAndUpdate(
        { _id: id, activo: true },
        { $unset: { fotoArchivo: 1 }, $set: { fotoSubida: null } },
        { projection: { _id: 1 } },
      )
      .lean();
  }

  /**
   * Da de baja (lógica) un colectivo. También se borra su foto subida.
   * @param {Id} id
   * @returns {Promise<(import("mongoose").Document & ColectivoGuardado) | null>} El documento
   *   ANTES del cambio (sin `new: true` ni lean), o null si no existe.
   */
  async eliminarColectivo(id) {
    return await this.model.findByIdAndUpdate(id, {
      $set: { activo: false, fotoSubida: null },
      $unset: { fotoArchivo: 1 },
    });
  }

  /**
   * Actualiza campos de un colectivo (corre las validaciones del schema).
   * @param {Id} id
   * @param {Partial<Colectivo>} cambios
   * @returns {Promise<ColectivoGuardado | null>} El colectivo actualizado, o null si no existe.
   */
  async actualizar(id, cambios) {
    return await this.model
      .findByIdAndUpdate(id, { $set: cambios }, { new: true, runValidators: true })
      .lean();
  }

  /**
   * Agrega una denuncia al colectivo.
   * @param {Id} colectivoId
   * @param {Denuncia} denuncia
   * @returns {Promise<DenunciaGuardada | null>} La denuncia guardada (subdocumento de mongoose),
   *   o null si el colectivo no existe.
   */
  async guardarDenuncia(colectivoId, denuncia) {
    const colectivo = await this.model.findById(colectivoId).select("+denuncias");
    if (!colectivo) return null;
    colectivo.denuncias.push(denuncia);
    await colectivo.save();
    return colectivo.denuncias[colectivo.denuncias.length - 1];
  }

  /**
   * Indica si ya hay una denuncia hecha a partir de esa colaboración.
   * @param {Id} colaboracionId
   * @returns {Promise<boolean>}
   */
  // Una sola consulta para varias colaboraciones (en vez de preguntar una por una)
  /**
   * Ids (como texto) de las colaboraciones de la lista que ya tienen una denuncia.
   * @param {Id[]} colaboracionIds
   * @returns {Promise<Set<string>>}
   */
  async colaboracionesDenunciadas(colaboracionIds) {
    const colectivos = await this.model
      .find({ "denuncias.colaboracionId": { $in: colaboracionIds } })
      .select("denuncias.colaboracionId")
      .lean();
    return new Set(
      colectivos.flatMap((colectivo) =>
        colectivo.denuncias.map((denuncia) => String(denuncia.colaboracionId)),
      ),
    );
  }

  async existeDenunciaParaColaboracion(colaboracionId) {
    const count = await this.model.countDocuments({
      "denuncias.colaboracionId": colaboracionId,
    });
    return count > 0;
  }

  /**
   * Todas las denuncias de todos los colectivos (las más nuevas primero), opcionalmente
   * filtradas por estado y/o por colectivo.
   * @param {{ estado?: EstadoDenunciaValor, colectivoId?: Id }} [filtro]
   * @returns {Promise<DenunciaConColectivo[]>}
   */
  async obtenerTodasLasDenuncias(filtro = {}) {
    /** @type {import("mongoose").PipelineStage[]} */
    const pipeline = [];
    if (filtro.colectivoId) {
      // Un id con formato inválido no puede ser de ningún colectivo: lista vacía
      if (!mongoose.isValidObjectId(filtro.colectivoId)) return [];
      pipeline.push({ $match: { _id: new mongoose.Types.ObjectId(String(filtro.colectivoId)) } });
    }
    pipeline.push({ $unwind: "$denuncias" });
    if (filtro.estado) {
      pipeline.push({ $match: { "denuncias.estado": filtro.estado } });
    }
    pipeline.push({
      $project: {
        _id: "$denuncias._id",
        descripcion: "$denuncias.descripcion",
        fecha: "$denuncias.fecha",
        estado: "$denuncias.estado",
        colaboracionId: "$denuncias.colaboracionId",
        colectivoId: "$_id",
        colectivoNombre: "$nombre",
      },
    });
    pipeline.push({ $sort: { fecha: -1 } });
    return await this.model.aggregate(pipeline);
  }

  /**
   * Busca una denuncia por id, con los datos de su colectivo (y si sigue activo).
   * @param {Id} denunciaId
   * @returns {Promise<(DenunciaConColectivo & { colectivoActivo: boolean }) | null>}
   */
  async obtenerDenunciaPorId(denunciaId) {
    const colectivo = await this.model
      .findOne({ "denuncias._id": denunciaId }, { "denuncias.$": 1, nombre: 1, activo: 1, _id: 1 })
      .lean();
    if (!colectivo || !colectivo.denuncias || colectivo.denuncias.length === 0) {
      return null;
    }
    const denuncia = colectivo.denuncias[0];
    return {
      ...denuncia,
      colectivoId: colectivo._id,
      colectivoNombre: colectivo.nombre,
      // El admin lo usa para saber si todavía puede dar de baja al colectivo
      colectivoActivo: colectivo.activo !== false,
    };
  }

  /**
   * Cambia el estado de una denuncia.
   * @param {Id} denunciaId
   * @param {EstadoDenunciaValor} nuevoEstado
   * @returns {Promise<DenunciaConColectivo | null>} La denuncia actualizada, o null si no existe.
   */
  async actualizarEstadoDenuncia(denunciaId, nuevoEstado) {
    const colectivo = await this.model
      .findOneAndUpdate(
        { "denuncias._id": denunciaId },
        { $set: { "denuncias.$.estado": nuevoEstado } },
        { new: true, select: "+denuncias" },
      )
      .lean();

    if (!colectivo) {
      return null;
    }

    const denuncia = colectivo.denuncias?.find((d) => String(d._id) === String(denunciaId));
    if (!denuncia) return null;

    return {
      ...denuncia,
      colectivoId: colectivo._id,
      colectivoNombre: colectivo.nombre,
    };
  }

  //Estadisticas
  /**
   * Cantidad de colectivos activos por ubicación, de mayor a menor.
   * @returns {Promise<Array<{ ubicacion: string | null, cantidad: number }>>}
   */
  async contarPorUbicacion() {
    return await this.model.aggregate([
      // Los colectivos dados de baja no cuentan (igual que en GET /colectivos)
      { $match: { activo: true } },
      { $group: { _id: "$ubicacion", cantidad: { $sum: 1 } } },
      { $sort: { cantidad: -1 } },
      { $project: { _id: 0, ubicacion: "$_id", cantidad: 1 } },
    ]);
  }
}
