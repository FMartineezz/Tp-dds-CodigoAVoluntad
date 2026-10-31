import { Denuncia, EstadoDenuncia } from "../models/denuncia.js";
import { AppError } from "../errors/appError.js";
import ErrorCatalog from "../errors/errorCatalog.js";

const ESTADOS_ADMINISTRATIVOS_PERMITIDOS = new Set([
  EstadoDenuncia.EN_REVISION,
  EstadoDenuncia.RESUELTA,
  EstadoDenuncia.DESCARTADA,
]);

export class DenunciaService {
  constructor({ colectivoRepository, colaboracionRepository }) {
    this.colectivoRepository = colectivoRepository;
    this.colaboracionRepository = colaboracionRepository;
  }

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

    const proyecto = colaboracion.proyecto;
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

  async obtenerDenunciasParaAdmin(filtro = {}) {
    return await this.colectivoRepository.obtenerTodasLasDenuncias(filtro);
  }

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
      estadoNormalizado,
    );

    if (!denunciaActualizada) {
      throw new AppError(ErrorCatalog.DENUNCIA_NO_ENCONTRADA, 404, denunciaId);
    }

    return denunciaActualizada;
  }
}
