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

  async crearProyecto(titulo, descripcion, perfiles, colectivo, urlSistema, fechaCierre) {
    //en vez de nombre, usar id
    const colectivoEncontrado = await this.colectivoService.obtenerColectivoPorNombre(colectivo);

    //en vez de nombre de colectivo, usar id
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

    const perfilesCreados = await Promise.all(
      perfiles.map((perfil) =>
        this.perfilService.crearPerfil(
          perfil.descripcion,
          perfil.habilidadesRequeridas,
          perfil.habilidadesOpcionales,
          perfil.horas,
          perfil.tipoDeCompromiso,
          perfil.modalidadDeColaboracion,
        ),
      ),
    );

    const proyectoNuevo = new Proyecto(
      titulo,
      descripcion,
      perfilesCreados,
      colectivoEncontrado,
      urlSistema,
      fechaCierre,
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
    const campos = Object.keys(cambios);

    if (campos.length !== 1 || campos[0] !== "finalizado" || cambios.finalizado !== true) {
      throw new AppError(ErrorCatalog.ARGUMENTO_INVALIDO, 400);
    }

    return await this.finalizarProyecto(id);
  }

  async agregarPerfil(
    proyectoId,
    descripcion,
    habilidadesRequeridas,
    habilidadesOpcionales,
    horas,
    tipoDeCompromiso,
    modalidadDeColaboracion,
  ) {
    const perfil = await this.perfilService.crearPerfil(
      descripcion,
      habilidadesRequeridas,
      habilidadesOpcionales,
      horas,
      tipoDeCompromiso,
      modalidadDeColaboracion,
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
}
