import { Proyecto } from "../models/proyecto.js";
import proyectoRepositoryDefault from "../repositories/proyectoRepository.js";
import habilidadServiceDefault from "./habilidadService.js";
import colectivoServiceDefault from "./colectivoService.js";
import { AppError } from "../errors/appError.js";
import ErrorCatalog from "../errors/errorCatalog.js";

class ProyectoService {
  constructor(
    proyectoRepository = proyectoRepositoryDefault,
    habilidadService = habilidadServiceDefault,
    colectivoService = colectivoServiceDefault,
  ) {
    this.proyectoRepository = proyectoRepository;
    this.habilidadService = habilidadService;
    this.colectivoService = colectivoService;
  }

  crearProyecto(
    titulo,
    descripcion,
    habilidadesRequeridas,
    horas,
    tipoDeCompromiso,
    modalidadDeColaboracion,
    colectivo,
  ) {
    const proyecto = this.proyectoRepository.obtenerPorTituloYColectivo(titulo, colectivo);

    if (proyecto) {
      throw new AppError(ErrorCatalog.PROYECTO_YA_EXISTENTE, 409, proyecto.id);
    }

    const habilidadesEncontradas = habilidadesRequeridas.map((codigo) => {
      const habilidad = this.habilidadService.obtenerHabilidadPorCodigo(codigo);
      if (!habilidad) {
        throw new AppError(ErrorCatalog.PROYECTO_HABILIDAD_INEXISTENTE, 400, codigo);
      }
      return habilidad;
    });

    const colectivoEncontrado = this.colectivoService.obtenerColectivoPorNombre(colectivo);

    const proyectoNuevo = new Proyecto(
      titulo,
      descripcion,
      habilidadesEncontradas,
      horas,
      tipoDeCompromiso,
      modalidadDeColaboracion,
      colectivoEncontrado,
    );

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
}

export default new ProyectoService();
