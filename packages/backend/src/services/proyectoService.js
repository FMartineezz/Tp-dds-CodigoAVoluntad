import ProyectoModel from "../models/proyecto.js";
import { AppError } from "../errors/appError.js";
import ErrorCatalog from "../errors/errorCatalog.js";

export class ProyectoService {

    constructor({ proyectoRepository, habilidadService, colectivoService }){
        this.proyectoRepository = proyectoRepository;
        this.habilidadService = habilidadService;
        this.colectivoService = colectivoService
    }

    crearProyecto(
        titulo,
        descripcion,
        habilidadesRequeridas,
        horas,
        tipoDeCompromiso,
        modalidadDeColaboracion,
        colectivo
    ) {

        const proyecto = this.proyectoRepository.obtenerPorTituloYColectivo(titulo, colectivo);
        
        if(proyecto){
            throw new AppError(ErrorCatalog.PROYECTO_YA_EXISTENTE, 409, proyecto.id);
        }   

        const habilidadesEncontradas = habilidadesRequeridas.map((codigo) => this.habilidadService.obtenerHabilidadPorCodigo(codigo));
    
        const colectivoEncontrado = this.colectivoService.obtenerColectivoPorNombre(colectivo);

        const proyectoNuevo = new ProyectoModel.Proyecto(
            titulo,
            descripcion,
            habilidadesEncontradas,
            horas,
            tipoDeCompromiso,
            modalidadDeColaboracion,
            colectivoEncontrado
        );

        const proyectoGuardado = this.proyectoRepository.guardar(proyectoNuevo);
        
        this.colectivoService.agregarProyecto(colectivoEncontrado, proyectoGuardado);

        return proyectoGuardado;
    }

    obtenerProyectos() {
        return this.proyectoRepository.obtenerTodos();
    }

    obtenerProyectoPorId(id) {
        if (Number.isNaN(id)) {
        throw new AppError(ErrorCatalog.ARGUMENTO_INVALIDO, 400);
        }

        const proyecto = this.proyectoRepository.obtenerPorId(id);

        if (!proyecto) {
            throw new AppError(ErrorCatalog.PROYECTO_NO_ENCONTRADO, 404, id);
        }

        return proyecto;
    }

    finalizarProyecto(id) {
        if (Number.isNaN(id)) {
            throw new AppError(ErrorCatalog.ARGUMENTO_INVALIDO, 400);
        }
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
}
