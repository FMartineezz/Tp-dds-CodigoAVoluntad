import Habilidad from '../models/entities/habilidad.js';;
export class HabilidadService {
    constructor(repository){
        this.repository = repository
    }
    
    crearHabilidad(titulo, descripcion) {
        if (!titulo || !descripcion) {
            throw new Error('El título y la descripción son obligatorios');
        }
        if (typeof titulo !== 'string' || typeof descripcion !== 'string') {
            throw new Error('El titulo y/o la descripcion deben ser cadenas de texto');
        }
            const habilidad = new Habilidad(titulo, descripcion);
            this.repository.agregarHabilidad(habilidad);
            return habilidad;
    }

    obtenerHabilidades(){
        return this.repository.obtenerHabilidades();
    }

    obtenerHabilidadPorId(id){
      return this.repository.obtenerHabilidadPorId(id);
    }
}
