import { Denuncia, EstadoDenuncia } from "../models/denuncia.js";
import { AppError } from "../errors/appError.js";
import ErrorCatalog from "../errors/errorCatalog.js";

/** @type {Set<string>} */
const ESTADOS_ADMINISTRATIVOS_PERMITIDOS = new Set([
  EstadoDenuncia.EN_REVISION,
  EstadoDenuncia.RESUELTA,
  EstadoDenuncia.DESCARTADA,
]);

/** @typedef {import("../types.js").Id} Id */
/** @typedef {import("../types.js").DenunciaGuardada} DenunciaGuardada */
/** @typedef {typeof EstadoDenuncia[keyof typeof EstadoDenuncia]} EstadoDenunciaValor */

/**
 * Datos públicos de una denuncia recién creada (sin la identidad de quien denuncia).
 * @typedef {object} DenunciaCreada
 * @property {Id} id
 * @property {Id} _id
 * @property {string} descripcion
 * @property {Date} fecha
 * @property {EstadoDenunciaValor} estado
 * @property {Id} colaboracionId
 */

/**
 * Denuncias de personas contra colectivos: alta (acreditando participación real) y gestión
 * administrativa. Las denuncias se guardan dentro del colectivo denunciado.
 */
export class DenunciaService {
  /**
   * @param {object} deps
   * @param {import("../repositories/colectivoRepository.js").ColectivoRepository} deps.colectivoRepository
   * @param {import("../repositories/colaboracionRepository.js").ColaboracionRepository} deps.colaboracionRepository
   */
  constructor({ colectivoRepository, colaboracionRepository }) {
    this.colectivoRepository = colectivoRepository;
    this.colaboracionRepository = colaboracionRepository;
  }

  /**
   * Crea una denuncia a partir de una colaboración (una sola por colaboración).
   * @param {Id} colaboracionId
   * @param {{ descripcion?: string }} [datos]
   * @returns {Promise<DenunciaCreada>}
   * @throws {AppError} 400 si falta la descripción o la colaboración no acredita participación
   *   o su proyecto no tiene colectivo; 404 si no existe la colaboración o el colectivo;
   *   409 si ya hay una denuncia para esa colaboración.
   */
  async crearDenuncia(colaboracionId, { descripcion } = {}) {
    if (!descripcion || typeof descripcion !== "string" || descripcion.trim() === "") {
      throw new AppError(ErrorCatalog.DENUNCIA_DESCRIPCION_REQUERIDA, 400);
    }

    const colaboracion = await this.colaboracionRepository.obtenerPorIdParaAdmin(colaboracionId);

    if (!colaboracion) {
      throw new AppError(ErrorCatalog.COLABORACION_NO_ENCONTRADA, 404, colaboracionId);
    }

    // Acreditación de participación real:
    // Tanto colaboraciones activas como finalizadas / dadas de baja acreditan participación real.
    // Una colaboración sin persona o sin proyecto no acredita una participación concretada.
    if (!colaboracion.personaColaboradora || !colaboracion.proyecto) {
      throw new AppError(ErrorCatalog.DENUNCIA_COLABORACION_NO_ACREDITA_PARTICIPACION, 400);
    }

    // Viene poblado (obtenerPorIdParaAdmin); su colectivo puede estar poblado o ser solo el id.
    const proyecto = /** @type {{ colectivo?: any }} */ (
      /** @type {unknown} */ (colaboracion.proyecto)
    );
    const colectivoId =
      proyecto.colectivo?._id || proyecto.colectivo?.id || proyecto.colectivo;

    if (!colectivoId) {
      throw new AppError(ErrorCatalog.DENUNCIA_PROYECTO_SIN_COLECTIVO, 400);
    }

    const colectivo = await this.colectivoRepository.obtenerPorId(colectivoId);
    if (!colectivo) {
      throw new AppError(ErrorCatalog.COLECTIVO_NO_ENCONTRADO, 404, colectivoId);
    }

    const yaDenunciado =
      await this.colectivoRepository.existeDenunciaParaColaboracion(colaboracionId);
    if (yaDenunciado) {
      throw new AppError(ErrorCatalog.DENUNCIA_DUPLICADA, 409);
    }

    const denuncia = new Denuncia(descripcion.trim(), colaboracionId);
    const denunciaGuardada = await this.colectivoRepository.guardarDenuncia(
      colectivoId,
      denuncia,
    );
    denuncia.id = denunciaGuardada.id || denunciaGuardada._id;

    // Respuesta protegida: solo retorna los atributos de la denuncia, sin identidad
    return {
      id: denuncia.id,
      _id: denunciaGuardada._id || denuncia.id,
      descripcion: denuncia.descripcion,
      fecha: denuncia.fecha,
      estado: denuncia.estado,
      colaboracionId: denuncia.colaboracionId,
    };
  }

  /**
   * Todas las denuncias (de todos los colectivos), opcionalmente filtradas.
   * @param {object} [filtro] Filtro que entiende el repositorio (por ejemplo, por estado).
   * @returns {Promise<object[]>}
   */
  async obtenerDenunciasParaAdmin(filtro = {}) {
    return await this.colectivoRepository.obtenerTodasLasDenuncias(filtro);
  }

  /**
   * Una denuncia con su colaboración completa (o null si ya no existe).
   * @param {Id} denunciaId
   * @returns {Promise<object>}
   * @throws {AppError} 404 si no existe la denuncia.
   */
  async obtenerDenunciaPorIdParaAdmin(denunciaId) {
    const denuncia = await this.colectivoRepository.obtenerDenunciaPorId(denunciaId);

    if (!denuncia) {
      throw new AppError(ErrorCatalog.DENUNCIA_NO_ENCONTRADA, 404, denunciaId);
    }

    const colaboracion = await this.colaboracionRepository.obtenerPorIdParaAdmin(
      denuncia.colaboracionId,
    );

    return {
      ...denuncia,
      colaboracion: colaboracion ?? null,
    };
  }

  /**
   * Cambia el estado de una denuncia a uno de los estados administrativos permitidos.
   * @param {Id} denunciaId
   * @param {string} nuevoEstado Se compara sin distinguir mayúsculas.
   * @returns {Promise<object>} La denuncia actualizada.
   * @throws {AppError} 400 si falta el estado o no es válido; 404 si no existe la denuncia.
   */
  async actualizarEstadoDenuncia(denunciaId, nuevoEstado) {
    if (!nuevoEstado) {
      throw new AppError(ErrorCatalog.DENUNCIA_ESTADO_REQUERIDO, 400);
    }

    const estadoNormalizado =
      typeof nuevoEstado === "string" ? nuevoEstado.toLowerCase() : nuevoEstado;

    if (!ESTADOS_ADMINISTRATIVOS_PERMITIDOS.has(estadoNormalizado)) {
      throw new AppError(ErrorCatalog.DENUNCIA_ESTADO_INVALIDO, 400);
    }

    const denunciaActualizada = await this.colectivoRepository.actualizarEstadoDenuncia(
      denunciaId,
      /** @type {EstadoDenunciaValor} */ (estadoNormalizado),
    );

    if (!denunciaActualizada) {
      throw new AppError(ErrorCatalog.DENUNCIA_NO_ENCONTRADA, 404, denunciaId);
    }

    return denunciaActualizada;
  }
}
