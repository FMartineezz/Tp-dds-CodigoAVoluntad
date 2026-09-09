import ProyectoModel from "../models/proyecto.js";
import proyectoRepositoryDefault from "../repositories/proyectoRepository.js";
import habilidadServiceDefault from "./habilidadService.js";
import colectivoServiceDefault from "./colectivoService.js"
import { AppError } from "../errors/appError.js";
import ErrorCatalog from "../errors/errorCatalog.js";

class ProyectoService {

    constructor(proyectoRepository = proyectoRepositoryDefault, habilidadService = habilidadServiceDefault, colectivoService = colectivoServiceDefault){
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
            throw new AppError(ErrorCatalog.PROYECTO_YA_EXISTENTE, 409)
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

        return this.proyectoRepository.guardar(proyectoNuevo);
    }

    obtenerProyectos() {
        return this.proyectoRepository.obtenerTodos();
    }

    obtenerProyectoPorId(id) {

        const proyecto = this.proyectoRepository.obtenerPorId(id);

        if (!proyecto) {
            throw new AppError(
                ErrorCatalog.PROYECTO_NO_ENCONTRADO,
                404
            );
        }

        return proyecto;
    }

    finalizarProyecto(id) {
    const proyecto = this.proyectoRepository.obtenerPorId(id);

    if (!proyecto) {
        throw new AppError(
            ErrorCatalog.PROYECTO_NO_ENCONTRADO,
            404
        );
    }

    proyecto.finalizado = true;

    return proyecto;

    }

    

}

export default new ProyectoService();