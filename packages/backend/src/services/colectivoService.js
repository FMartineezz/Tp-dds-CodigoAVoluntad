import { TipoColectivo } from '../models/colectivo.js';

class ColectivoService {
    constructor(repository){
        this.repository = repository;
    }
    
    crearColectivo(nombre, descripcion, ubIcacion, tipoDeColectivo, proyectos) {
        if (!nombre || !descripcion || !tipoDeColectivo) {
            throw new Error('El título, la descripción y el tipo de colectivo son obligatorios');
        }
        if (typeof nombre !== 'string' || typeof descripcion !== 'string') {
            throw new Error('El titulo y/o la descripcion deben ser cadenas de texto');
        }
        if (!Object.values(TipoColectivo).includes(tipoDeColectivo)) {
            throw new Error('El tipo de colectivo deben ser TipoColectivo');
        }
        // if (typeof proyectos !== Array) {
        //     throw new Error('El tipo de colectivo deben ser TipoColectivo');
        // }

        return this.repository.crearColectivo(nombre, descripcion, ubIcacion, tipoDeColectivo, proyectos)

    }

    obtenerColectivos(){
        return this.repository.obtenerColectivos();
    }

    obtenerColectivoPorId(id){
        if (Number.isNaN(id)) {
            throw new Error("El id debe ser numérico");
        }
        
        return this.repository.obtenerColectivoPorId(id);
    }
}

export default ColectivoService;