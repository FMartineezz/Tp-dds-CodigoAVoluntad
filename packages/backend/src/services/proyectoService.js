import Proyecto from '../models/entities/proyecto.js';

export class ProyectoService{
    constructor(){
        this.proyecto()= [];
    }

    cargarProyecto(titulo, descripcion, habilidadesRequeridas, horas, tipoDeCompromiso, modalidadDeColaboracion, colectivo){
        if (!titulo || !descripcion || habilidadesRequeridas || horas || tipoDeCompromiso || modalidadDeColaboracion || colectivo) {
            throw new Error('Faltan llenar campos del constructor');
        }
        const proyecto = new Proyecto(titulo, descripcion, habilidadesRequeridas, horas, tipoDeCompromiso, modalidadDeColaboracion, colectivo);
            this.proyecto.push(proyecto);
            return proyecto;
    }

    obtenerProyectos(){
        return this.proyecto;
    }

    obtenerProyectoPorId(id){
        if (Number.isNaN(id)) {
            throw new Error("El id debe ser numérico");
        }
        
        for(const proyecto of this.proyecto){
            if(proyecto.id == id ){
                return proyecto;
            }
        }
        return null;
    }
}
