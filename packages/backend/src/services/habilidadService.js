import Habilidad from '../models/habilidad.js';;
export class HabilidadService {
    constructor(repository){
        this.repository = repository
    }
    
    crearHabilidad(titulo, descripcion) {
        if (!titulo) {
            throw new Error('El título es obligatoria');
        }
        if(!descripcion){
            throw new Error('La descripción es obligatoria');
        }
        if(typeof titulo !== 'string'){
            throw new Error('El titulo debe ser cadena de texto');
        }
        if (typeof descripcion !== 'string') {
            throw new Error('La descripcion debe ser cadena de texto');
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
            throw new Error("El id debe ser numérico");
        }  
        return this.repository.obtenerHabilidadPorId(id);
    }
}
