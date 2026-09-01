import Habilidad from '../models/habilidad.js';

class HabilidadService {
    constructor(){
        this.habilidades = [];
    }
    
    crearHabilidad(titulo, descripcion) {
        if (!titulo || !descripcion) {
            throw new Error('El título y la descripción son obligatorios');
        }
        if (typeof titulo !== 'string' || typeof descripcion !== 'string') {
            throw new Error('El titulo y/o la descripcion deben ser cadenas de texto');
        }
            const habilidad = new Habilidad(titulo, descripcion);
            this.habilidades.push(habilidad);
            return habilidad;
    }

    obtenerHabilidades(){
        return this.habilidades;
    }

    obtenerHabilidadPorId(id){
        if (Number.isNaN(id)) {
            throw new Error("El id debe ser numérico");
        }
        
        for(const habilidad of this.habilidades){
            if(habilidad.id == id ){
                return habilidad;
            }
        }
        return null;
    }
}

export default new HabilidadService();