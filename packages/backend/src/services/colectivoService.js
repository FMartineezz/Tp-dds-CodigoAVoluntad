import { AppError } from "../errors/appError.js";
import ErrorCatalog from "../errors/errorCatalog.js";
import { Colectivo } from "../models/colectivo.js";
import { TipoColectivo } from '../models/colectivo.js';
import colectivoRepositoryDefault from '../repositories/colectivoRepository.js';

class ColectivoService {
    constructor(repository = colectivoRepositoryDefault){
        this.repository = repository;
    }
    
    crearColectivo(nombre, descripcion, ubIcacion, tipoDeColectivo, proyectos) {

        const colectivo = this.repository.obtenerColectivoPorNombre(nombre);

        if(colectivo){
            throw new Error('El colectivo ya existe');
        }

        const nuevoColectivo = new Colectivo(nombre, descripcion, ubIcacion, tipoDeColectivo, proyectos);
        this.repository.agregarColectivo(nuevoColectivo);
        
        return nuevoColectivo;

    }

    obtenerColectivos(){
        return this.repository.obtenerColectivos();
    }

    obtenerColectivoPorId(id){
        if (Number.isNaN(id)) {
            throw new Error("El id debe ser numérico");
        }
        const colectivo =  this.repository.obtenerColectivoPorId(id);

        if(!colectivo){
            throw new AppError(ErrorCatalog.COLECTIVO_NO_ENCONTRADO, 404, id);
        }

        return colectivo;
    }

    obtenerColectivoPorNombre(nombre){
        const colectivo = this.repository.obtenerColectivoPorNombre(nombre);

        if(!colectivo){
            throw new AppError(ErrorCatalog.COLECTIVO_NO_ENCONTRADO_POR_NOMBRE, 404, nombre);
        }

        return colectivo;
    }

}

export default new ColectivoService();