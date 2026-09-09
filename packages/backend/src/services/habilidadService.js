import { AppError } from '../errors/appError.js';
import ErrorCatalog from '../errors/errorCatalog.js';
import Habilidad from '../models/habilidad.js';
import habilidadRepository from "../repositories/habilidadRepository.js";


export class HabilidadService {
    constructor(repository = habilidadRepository){
        this.repository = repository
    }
    
    crearHabilidad(titulo, descripcion) {
        //Valido que no exista la habilidad
        const habilidadExistente = this.repository.buscarPorTituloYDescripcion(titulo, descripcion);
        if(habilidadExistente){
            throw new AppError(ErrorCatalog.HABILIDAD_YA_EXISTE ,409, habilidadExistente.id);
        }

            const habilidad = new Habilidad(titulo, descripcion);
            this.repository.agregarHabilidad(habilidad);
            return habilidad;
    }

    obtenerHabilidades(){
        return this.repository.findAll();
    }

    obtenerHabilidadPorId(id){
        if (Number.isNaN(id)) {
            throw new AppError(ErrorCatalog.ARGUMENTO_INVALIDO, 400);
        }  
        
        const habilidad = this.repository.findById(id);

        if (!habilidad) {
            throw new AppError(ErrorCatalog.HABILIDAD_NO_ENCONTRADA_POR_ID, 404, id);
        }

        return habilidad;
    }

    obtenerHabilidadPorCodigo(codigo){
        const habilidad = this.repository.buscarPorCodigo(codigo);
        if(!habilidad){
            throw new AppError(ErrorCatalog.HABILIDAD_NO_ENCONTRADA_POR_CODIGO, 404, codigo);
        }
        return habilidad;
    }
}

export default new HabilidadService();
