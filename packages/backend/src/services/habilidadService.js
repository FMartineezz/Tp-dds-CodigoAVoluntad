import { AppError } from '../errors/appError.js';
import ErrorCatalog from '../errors/errorCatalog.js';
import Habilidad from '../models/habilidad.js';;

export class HabilidadService {
    constructor(repository){
        this.repository = repository
    }
    
    crearHabilidad(titulo, descripcion) {
        //Valido que no exista la habilidad
        const habilidadExistente = this.repository.buscarPorTituloYDescripcion(titulo, descripcion);
        if(habilidadExistente){
            throw new AppError(ErrorCatalog.HABILIDAD_YA_EXISTE ,409);
        }

            const habilidad = new Habilidad(titulo, descripcion);
            this.repository.agregarHabilidad(habilidad);
            return habilidad;
    }

    obtenerHabilidades(){
        return this.repository.obtenerHabilidades();
    }

    obtenerHabilidadPorId(id){
        if (Number.isNaN(id)) {
            throw new AppError(ErrorCatalog.ARGUMENTO_INVALIDO, 400);
        }  
        
        const habilidad = this.repository.obtenerHabilidadPorId(id);

        if (!habilidad) {
            throw new AppError(ErrorCatalog.HABILIDAD_NO_ENCONTRADA, 404);
        }

        return habilidad;
    }
}
