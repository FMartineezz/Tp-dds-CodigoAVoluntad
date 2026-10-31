import { AppError } from "../errors/appError.js";
import ErrorCatalog from "../errors/errorCatalog.js";
import { Colectivo } from "../models/colectivo.js";
import { validarYNormalizarRedesSociales } from "./redSocialService.js";

export class ColectivoService {
  constructor({ repository }) {
    this.repository = repository;
  }

  async crearColectivo(
    nombre,
    descripcion,
    ubicacion,
    tipoDeColectivo,
    proyectos = [],
    redesSociales = [],
  ) {
    const redesValidadas = validarYNormalizarRedesSociales(redesSociales) ?? [];

    const colectivo = await this.repository.obtenerPorNombre(nombre);

    if (colectivo) {
      throw new AppError(ErrorCatalog.COLECTIVO_YA_EXISTE, 409, nombre);
    }

    const nuevoColectivo = new Colectivo(
      nombre,
      descripcion,
      ubicacion,
      tipoDeColectivo,
      proyectos,
      redesValidadas,
    );

    const colectivoGuardado = await this.repository.guardar(nuevoColectivo);
    nuevoColectivo.id = colectivoGuardado.id;

    return nuevoColectivo;
  }

  async actualizarColectivo(id, cambios = {}) {
    if (!cambios || Object.keys(cambios).length === 0) {
      throw new AppError(ErrorCatalog.ARGUMENTO_INVALIDO, 400);
    }

    const colectivo = await this.repository.obtenerPorId(id);
    if (!colectivo) {
      throw new AppError(ErrorCatalog.COLECTIVO_NO_ENCONTRADO, 404, id);
    }

    const cambiosPreparados = { ...cambios };

    if (cambios.redesSociales !== undefined) {
      cambiosPreparados.redesSociales = validarYNormalizarRedesSociales(cambios.redesSociales);
    }

    return await this.repository.actualizar(id, cambiosPreparados);
  }

  async actualizar(id, cambios) {
    return await this.actualizarColectivo(id, cambios);
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

  async agregarProyecto(colectivoId, proyectoId) {
    const colectivo = await this.repository.obtenerPorId(colectivoId);
    colectivo.proyectos.push(proyectoId);
    await this.repository.agregarProyecto(colectivoId, proyectoId);
  }

  async eliminarColectivo(id) {
    const colectivo = await this.repository.obtenerPorId(id);

    if (!colectivo) {
      throw new AppError(ErrorCatalog.COLECTIVO_NO_ENCONTRADO, 404, id);
    }

    if (colectivo.activo) {
      throw new AppError(ErrorCatalog.COLECTIVO_YA_DADO_DE_BAJA, 409, id);
    }

  }
}
