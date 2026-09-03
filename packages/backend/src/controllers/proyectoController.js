import ProyectoService from '../services/proyectoService.js';

export class ProyectoController {
    crearProyecto(req, res) {
        try{
            const respuesta = ProyectoService.crearProyecto(req.body.titulo, req.body.descripcion, req.habilidadesRequeridas, req.horas, req.tipoDeCompromiso, req.modalidadDeColaboracion, req.colectivo);
            res.status(201).json(respuesta);
            return; 
        }
        catch (error){
            res.status(400).json("Error al crear la proyecto: " + error.message);
        }
    }

    obtenerProyectos(req,res){
        try{
            const respuesta = ProyectosService.obtenerProyectos();
            res.status(200).json(respuesta);
            return;
        }
        catch(error){
            res.status(400).json(error.message);
        }   
    }

    obtenerProyectoPorId(req,res){
        const id = Number(req.params.id);
            
        try{
            const respuesta = ProyecyoService.obtenerProyectoPorId(id);    
            if(!respuesta){
                res.status(404).json("No se encontro el proyecto id : " + id);
                return;
            }
            res.status(200).json(respuesta);
        }
        catch(error){
            res.status(400).json(error.message);
        }
            
    }

}
