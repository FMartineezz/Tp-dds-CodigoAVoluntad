import { PersonaColaboradoraModel } from "../schemas/personaColaboradoraSchema.js";
import { paginar } from "./paginar.js";
import { contieneTexto, todasLasCondiciones } from "./filtros.js";

/** @typedef {import("../types.js").Id} Id */
/** @typedef {import("../types.js").PersonaColaboradoraGuardada} PersonaColaboradoraGuardada */
/** @typedef {import("../models/personaColaboradora.js").PersonaColaboradora} PersonaColaboradora */

/**
 * Resultado de dar de baja a una persona.
 * @typedef {{ actualizado: true } | { actualizado: false, razon: "NO_ENCONTRADO" | "YA_DADO_DE_BAJA" }} ResultadoBaja
 */

/**
 * Filtros opcionales del listado de personas (los que vienen en undefined no se aplican).
 * @typedef {object} FiltrosDePersonas
 * @property {string} [busqueda] Texto que aparece en el nombre, el apellido o el nombre de fantasía.
 * @property {Id} [habilidadId] Habilidad que tiene que tener la persona.
 * @property {boolean} [aceptaMensajes] true: solo quienes reciben mensajes internos; false: solo quienes los bloquean.
 */

/**
 * Arma el filtro de mongo del listado de personas.
 * @param {FiltrosDePersonas} filtros
 * @returns {Record<string, any>}
 */
function filtroDePersonas({ busqueda, habilidadId, aceptaMensajes }) {
  const condiciones = [];
  if (busqueda) {
    condiciones.push({
      $or: [
        { nombre: contieneTexto(busqueda) },
        { apellido: contieneTexto(busqueda) },
        { nombreFantasia: contieneTexto(busqueda) },
      ],
    });
  }
  if (habilidadId) condiciones.push({ habilidades: habilidadId });
  // Se compara con $ne: true porque en las personas viejas el campo puede no estar (= acepta)
  if (aceptaMensajes === true) condiciones.push({ bloquearMensajeInterno: { $ne: true } });
  if (aceptaMensajes === false) condiciones.push({ bloquearMensajeInterno: true });
  return todasLasCondiciones(condiciones);
}

/** Acceso a la colección de personas colaboradoras. */
export class PersonaColaboradoraRepository {
  constructor() {
    this.model = PersonaColaboradoraModel;
  }

  /**
   * Guarda una persona colaboradora nueva.
   * @param {PersonaColaboradora} personaColaboradora
   * @returns {Promise<import("mongoose").Document & PersonaColaboradoraGuardada>} El documento de mongoose (sin lean).
   */
  async guardar(personaColaboradora) {
    const nuevaPersonaColaboradora = new this.model(personaColaboradora);
    return await nuevaPersonaColaboradora.save();
  }

  /**
   * Todas las personas colaboradoras (sin contactos).
   * @returns {Promise<PersonaColaboradoraGuardada[]>}
   */
  async obtenerTodas() {
    return await this.model.find().lean();
  }

  // El total se cuenta con los mismos filtros, así la paginación sigue cerrando
  /**
   * Una página de personas colaboradoras.
   * @param {import("../types.js").Paginacion} paginacion
   * @param {FiltrosDePersonas} [filtros]
   * @returns {Promise<import("../types.js").Pagina<PersonaColaboradoraGuardada>>}
   */
  async obtenerPagina(paginacion, filtros = {}) {
    return await paginar(this.model, filtroDePersonas(filtros), paginacion);
  }

  /**
   * Busca una persona por id (sin contactos).
   * @param {Id} id
   * @returns {Promise<PersonaColaboradoraGuardada | null>}
   */
  async obtenerPorId(id) {
    return await this.model.findById(id).lean();
  }

  /**
   * Busca una persona por id incluyendo sus contactos (que por defecto no se leen).
   * @param {Id} id
   * @returns {Promise<PersonaColaboradoraGuardada | null>}
   */
  async obtenerPorIdConContactos(id) {
    return await this.model.findById(id).lean().select("+contactos");
  }

  /**
   * Personas que tienen alguna de las habilidades.
   * @param {Id[]} habilidadesIds
   * @returns {Promise<PersonaColaboradoraGuardada[]>}
   */
  async obtenerPorHabilidadId(habilidadesIds) {
    return await this.model.find({ habilidades: { $in: habilidadesIds } }).lean();
  }

  /**
   * Una página de personas que tienen alguna de las habilidades.
   * @param {Id[]} habilidadesIds
   * @param {import("../types.js").Paginacion} paginacion
   * @returns {Promise<import("../types.js").Pagina<PersonaColaboradoraGuardada>>}
   */
  async obtenerPaginaPorHabilidadId(habilidadesIds, paginacion) {
    return await paginar(this.model, { habilidades: { $in: habilidadesIds } }, paginacion);
  }

  /**
   * Actualiza campos de una persona (corre las validaciones del schema).
   * @param {Id} id
   * @param {Partial<PersonaColaboradora>} cambios
   * @returns {Promise<PersonaColaboradoraGuardada | null>} La persona actualizada, o null si no existe.
   */
  async actualizar(id, cambios) {
    return await this.model
      .findByIdAndUpdate(id, { $set: cambios }, { new: true, runValidators: true })
      .lean();
  }

  // ───── Foto de perfil subida ─────

  /**
   * Guarda la foto subida de una persona activo/a y anota cuándo se subió.
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
   * Da de baja a una persona activa: anonimiza sus datos (también borra su foto subida) y la
   * marca como inactiva.
   * @param {Id} id
   * @returns {Promise<ResultadoBaja>}
   */
  async eliminar(id) {
    const colaboradora = await this.model.findOneAndUpdate(
      { _id: id, activo: true },
      {
        $set: {
          nombreFantasia: "UserEliminado",
          git: `github:UserEliminado${id}`,
          nombre: "Usuario",
          apellido: "Eliminado",
          pronombres: [],
          presentacion: "Presentacion Usuario Eliminado",
          contactos: [],
          foto: null,
          fotoSubida: null,
          sitioWeb: null,
          activo: false,
        },
        $unset: { fotoArchivo: 1 },
      },
      { new: true },
    );

    if (colaboradora) {
      return { actualizado: true };
    }

    const existe = await this.model.findById(id);
    if (!existe) {
      return { actualizado: false, razon: "NO_ENCONTRADO" };
    }

    return { actualizado: false, razon: "YA_DADO_DE_BAJA" };
  }

  //Estadisticas
  /**
   * Totales y promedios de las personas colaboradoras.
   * @returns {Promise<Array<{ total: number, bloqueanMensajes: number, promedioHabilidadesPorPersona: number, promedioPostulacionesPorPersona: number }>>}
   *   Un solo elemento, o vacío si no hay personas.
   */
  async obtenerEstadisticas() {
    return await this.model.aggregate([
      {
        $lookup: {
          from: "postulaciones",
          localField: "_id",
          foreignField: "personaColaboradora",
          as: "postulacionesInfo",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          bloqueanMensajes: { $sum: { $cond: ["$bloquearMensajeInterno", 1, 0] } },
          promedioHabilidadesPorPersona: { $avg: { $size: "$habilidades" } },
          promedioPostulacionesPorPersona: { $avg: { $size: "$postulacionesInfo" } },
        },
      },
      {
        $project: {
          _id: 0,
          total: 1,
          bloqueanMensajes: 1,
          promedioHabilidadesPorPersona: { $round: ["$promedioHabilidadesPorPersona", 2] },
          promedioPostulacionesPorPersona: { $round: ["$promedioPostulacionesPorPersona", 2] },
        },
      },
    ]);
  }
}
