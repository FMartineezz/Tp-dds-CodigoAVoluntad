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

  async crearProyecto(titulo, descripcion, perfiles, colectivo) {
    //en vez de nombre de colectivo, usar id
    const proyecto = await this.proyectoRepository.obtenerPorTituloYColectivo(titulo, colectivo);

    if (proyecto) {
      throw new AppError(
        ErrorCatalog.PROYECTO_YA_EXISTENTE,
        409,
        proyecto.titulo,
        proyecto.colectivo.nombre,
      );
    }

    //en vez de nombre, usar id
    const colectivoEncontrado = await this.colectivoService.obtenerColectivoPorNombre(colectivo);

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

    const proyectoNuevo = new Proyecto(titulo, descripcion, perfilesCreados, colectivoEncontrado);
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

    //proyecto.finalizado = true;

    return await this.proyectoRepository.finalizarProyecto(id);
  }

  async actualizarProyecto(id, cambios = {}) {
    const campos = Object.keys(cambios);

    // Por ahora la única actualización parcial soportada es marcar el proyecto como finalizado.
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
    //delegar la responsabilidad al perfilService??(por ejemplo transformar a dto)
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
}
