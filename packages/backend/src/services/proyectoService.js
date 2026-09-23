import { Proyecto } from "../models/proyecto.js";
import proyectoRepositoryDefault from "../repositories/proyectoRepository.js";
import perfilServiceDefault from "./perfilService.js";
import colectivoServiceDefault from "./colectivoService.js";
import { AppError } from "../errors/appError.js";
import ErrorCatalog from "../errors/errorCatalog.js";

class ProyectoService {
  constructor({
    proyectoRepository = proyectoRepositoryDefault,
    perfilService = perfilServiceDefault,
    colectivoService = colectivoServiceDefault,
  } = {}) {
    this.proyectoRepository = proyectoRepository;
    this.perfilService = perfilService;
    this.colectivoService = colectivoService;
  }

  crearProyecto(titulo, descripcion, perfiles, colectivo) {
    const proyecto = this.proyectoRepository.obtenerPorTituloYColectivo(titulo, colectivo);

    if (proyecto) {
      throw new AppError(
        ErrorCatalog.PROYECTO_YA_EXISTENTE,
        409,
        proyecto.titulo,
        proyecto.colectivo.nombre,
      );
    }

    const colectivoEncontrado = this.colectivoService.obtenerColectivoPorNombre(colectivo);

    const perfilesCreados = perfiles.map((perfil) =>
      this.perfilService.crearPerfil(
        perfil.descripcion,
        perfil.habilidadesRequeridas,
        perfil.habilidadesOpcionales,
        perfil.horas,
        perfil.tipoDeCompromiso,
        perfil.modalidadDeColaboracion,
      ),
    );

    const proyectoNuevo = new Proyecto(titulo, descripcion, perfilesCreados, colectivoEncontrado);

    const proyectoGuardado = this.proyectoRepository.guardar(proyectoNuevo);

    this.colectivoService.agregarProyecto(colectivoEncontrado, proyectoGuardado);

    return proyectoGuardado;
  }

  obtenerProyectos() {
    return this.proyectoRepository.obtenerTodos();
  }

  obtenerProyectoPorId(id) {
    const proyecto = this.proyectoRepository.obtenerPorId(id);

    if (!proyecto) {
      throw new AppError(ErrorCatalog.PROYECTO_NO_ENCONTRADO, 404, id);
    }

    return proyecto;
  }

  finalizarProyecto(id) {
    const proyecto = this.proyectoRepository.obtenerPorId(id);

    if (!proyecto) {
      throw new AppError(ErrorCatalog.PROYECTO_NO_ENCONTRADO, 404, id);
    }

    if (proyecto.finalizado) {
      throw new AppError(ErrorCatalog.PROYECTO_FINALIZADO, 400, id);
    }

    proyecto.finalizado = true;

    return proyecto;
  }

  actualizarProyecto(id, cambios = {}) {
    const campos = Object.keys(cambios);

    // Por ahora la única actualización parcial soportada es marcar el proyecto como finalizado.
    if (campos.length !== 1 || campos[0] !== "finalizado" || cambios.finalizado !== true) {
      throw new AppError(ErrorCatalog.ARGUMENTO_INVALIDO, 400);
    }

    return this.finalizarProyecto(id);
  }

  estaFinalizado(proyecto) {
    return proyecto.finalizado;
  }

  agregarPerfil(
    proyectoId,
    descripcion,
    habilidadesRequeridas,
    habilidadesOpcionales,
    horas,
    tipoDeCompromiso,
    modalidadDeColaboracion,
  ) {
    const perfil = this.perfilService.crearPerfil(
      descripcion,
      habilidadesRequeridas,
      habilidadesOpcionales,
      horas,
      tipoDeCompromiso,
      modalidadDeColaboracion,
    );
    const perfilGuardado = this.proyectoRepository.guardarPerfil(proyectoId, perfil);
    return perfilGuardado;
  }

  obtenerPerfiles(proyectoId) {
    const proyecto = this.obtenerProyectoPorId(proyectoId);
    return proyecto.perfiles;
  }

  obtenerPerfilPorId(proyectoId, perfilId) {
    this.obtenerProyectoPorId(proyectoId);
    const perfil = this.proyectoRepository.obtenerPerfilPorId(proyectoId, perfilId);
    if (!perfil) {
      throw new AppError(ErrorCatalog.PERFIL_NO_ENCONTRADO, 404, perfilId);
    }
    return perfil;
  }
}

export default new ProyectoService();
