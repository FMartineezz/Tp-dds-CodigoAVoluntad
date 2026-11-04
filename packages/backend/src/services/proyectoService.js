import { Proyecto } from "../models/proyecto.js";
import { AppError } from "../errors/appError.js";
import ErrorCatalog from "../errors/errorCatalog.js";

export class ProyectoService {
  constructor({ proyectoRepository, perfilService, colectivoService, personaColaboradoraService }) {
    this.proyectoRepository = proyectoRepository;
    this.perfilService = perfilService;
    this.colectivoService = colectivoService;
    this.personaColaboradoraService = personaColaboradoraService;
  }

  validarUrlHttp(url) {
    if (!url || typeof url !== "string") return false;
    try {
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }

  async crearProyecto(
    titulo,
    descripcion,
    perfiles,
    colectivo,
    urlSistema,
    fechaCierre,
    fechaLimiteBusqueda,
    urlDonaciones,
  ) {
    //en vez de nombre, usar id
    const colectivoEncontrado = await this.colectivoService.obtenerColectivoPorNombre(colectivo);

    const proyecto = await this.proyectoRepository.obtenerPorTituloYColectivo(
      titulo,
      colectivoEncontrado._id,
    );

    if (proyecto) {
      throw new AppError(
        ErrorCatalog.PROYECTO_YA_EXISTENTE,
        409,
        proyecto.titulo,
        colectivoEncontrado.nombre,
      );
    }

    if (urlDonaciones !== undefined && urlDonaciones !== null && urlDonaciones !== "") {
      if (!this.validarUrlHttp(urlDonaciones)) {
        throw new AppError(ErrorCatalog.PROYECTO_URL_DONACIONES_INVALIDA, 400);
      }
    }

    //consultar si vale la pena
    const perfilesCreados = await Promise.all(
      perfiles.map((perfil) =>
        this.perfilService.crearPerfil(
          perfil.descripcion,
          perfil.habilidadesRequeridas,
          perfil.habilidadesOpcionales,
          perfil.horas,
          perfil.tipoDeCompromiso,
          perfil.modalidadDeColaboracion,
          perfil.cantidadMaxima,
        ),
      ),
    );

    const urlDonacionesFinal = urlDonaciones && urlDonaciones !== "" ? urlDonaciones : null;

    const proyectoNuevo = new Proyecto(
      titulo,
      descripcion,
      perfilesCreados,
      colectivoEncontrado,
      urlSistema,
      fechaCierre,
      fechaLimiteBusqueda,
      urlDonacionesFinal,
    );
    const proyectoGuardado = await this.proyectoRepository.guardar(proyectoNuevo);
    proyectoNuevo.id = proyectoGuardado.id;

    await this.colectivoService.agregarProyecto(colectivoEncontrado._id, proyectoGuardado._id);

    return proyectoGuardado;
  }

  async obtenerProyectos() {
    return await this.proyectoRepository.obtenerTodos();
  }

  async obtenerProyectoPorId(id) {
    const proyecto = await this.proyectoRepository.obtenerPorId(id);

    if (!proyecto) {
      throw new AppError(ErrorCatalog.PROYECTO_NO_ENCONTRADO, 404, id);
    }

    return proyecto;
  }

  async obtenerProyectosConAlgunaHabilidad(idsHabilidad) {
    const proyectos = await this.proyectoRepository.obtenerPorAlgunaHabilidad(idsHabilidad);
    console.log(proyectos);
    return proyectos;
  }

  async finalizarProyecto(id) {
    const proyecto = await this.proyectoRepository.obtenerPorId(id);

    if (!proyecto) {
      throw new AppError(ErrorCatalog.PROYECTO_NO_ENCONTRADO, 404, id);
    }

    if (proyecto.finalizado) {
      throw new AppError(ErrorCatalog.PROYECTO_FINALIZADO, 400, id);
    }

    return await this.proyectoRepository.finalizarProyecto(id);
  }

  async actualizarProyecto(id, cambios = {}) {
    if (!cambios || typeof cambios !== "object" || Array.isArray(cambios)) {
      throw new AppError(ErrorCatalog.ARGUMENTO_INVALIDO, 400);
    }

    const campos = Object.keys(cambios);
    if (campos.length === 0) {
      throw new AppError(ErrorCatalog.ARGUMENTO_INVALIDO, 400);
    }

    const camposPermitidos = ["finalizado", "urlDonaciones"];
    const tieneCamposNoPermitidos = campos.some((campo) => !camposPermitidos.includes(campo));
    if (tieneCamposNoPermitidos) {
      throw new AppError(ErrorCatalog.ARGUMENTO_INVALIDO, 400);
    }

    const proyecto = await this.proyectoRepository.obtenerPorId(id);
    if (!proyecto) {
      throw new AppError(ErrorCatalog.PROYECTO_NO_ENCONTRADO, 404, id);
    }

    const actualizaciones = {};

    if (cambios.finalizado !== undefined) {
      if (cambios.finalizado !== true) {
        throw new AppError(ErrorCatalog.ARGUMENTO_INVALIDO, 400);
      }
      if (proyecto.finalizado) {
        throw new AppError(ErrorCatalog.PROYECTO_FINALIZADO, 400, id);
      }
      actualizaciones.finalizado = true;
    }

    if (cambios.urlDonaciones !== undefined) {
      if (cambios.urlDonaciones === null || cambios.urlDonaciones === "") {
        actualizaciones.urlDonaciones = null;
      } else if (typeof cambios.urlDonaciones === "string") {
        if (!this.validarUrlHttp(cambios.urlDonaciones)) {
          throw new AppError(ErrorCatalog.PROYECTO_URL_DONACIONES_INVALIDA, 400);
        }
        actualizaciones.urlDonaciones = cambios.urlDonaciones;
      } else {
        throw new AppError(ErrorCatalog.PROYECTO_URL_DONACIONES_INVALIDA, 400);
      }
    }

    return await this.proyectoRepository.actualizarProyecto(id, actualizaciones);
  }

  async agregarPerfil(
    proyectoId,
    descripcion,
    habilidadesRequeridas,
    habilidadesOpcionales,
    horas,
    tipoDeCompromiso,
    modalidadDeColaboracion,
    cantidadMaxima,
  ) {
    const perfil = await this.perfilService.crearPerfil(
      descripcion,
      habilidadesRequeridas,
      habilidadesOpcionales,
      horas,
      tipoDeCompromiso,
      modalidadDeColaboracion,
      cantidadMaxima,
    );

    return await this.proyectoRepository.guardarPerfil(proyectoId, perfil);
  }

  async obtenerPerfiles(proyectoId) {
    const proyecto = await this.obtenerProyectoPorId(proyectoId);
    return proyecto.perfiles;
  }

  async obtenerPerfilPorId(proyectoId, perfilId) {
    await this.obtenerProyectoPorId(proyectoId);
    const perfil = await this.proyectoRepository.obtenerPerfilPorId(proyectoId, perfilId);
    if (!perfil) {
      throw new AppError(ErrorCatalog.PERFIL_NO_ENCONTRADO, 404, perfilId);
    }
    return perfil;
  }

  async actualizarPerfil(proyectoId, perfilId, cambios) {
    await this.obtenerProyectoPorId(proyectoId);
    await this.obtenerPerfilPorId(proyectoId, perfilId);

    const cambiosPreparados = await this.perfilService.prepararCambios(cambios);

    return await this.proyectoRepository.actualizarPerfil(proyectoId, perfilId, cambiosPreparados);
  }

  async eliminarPerfil(proyectoId, perfilId) {
    await this.obtenerProyectoPorId(proyectoId);
    await this.obtenerPerfilPorId(proyectoId, perfilId);

    return await this.proyectoRepository.eliminarPerfil(proyectoId, perfilId);
  }

  async cerrarProyectosSi(fechaActual) {
    await this.proyectoRepository.cerrarProyectoSi(fechaActual);
  }

  estaBusquedaAbierta(proyecto) {
    if (proyecto.busquedaCerrada === true) return false;
    if (proyecto.fechaLimiteBusqueda && new Date(proyecto.fechaLimiteBusqueda) < new Date()) {
      return false;
    }
    return true;
  }
}
