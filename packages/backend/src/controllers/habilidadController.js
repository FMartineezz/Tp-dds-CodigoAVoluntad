import HabilidadService from '../services/habilidadService.js';

class HabilidadController {
    crearHabilidad(req, res) {
        try{
            const respuesta = HabilidadService.crearHabilidad(req.body.titulo, req.body.descripcion);
            res.status(201).json(respuesta);
            return; 
        }
        catch (error){
            res.status(400).json("Error al crear la habilidad: " + error.message);
        }
    }

    obtenerHabilidades(req,res){
        try{
            const respuesta = HabilidadService.obtenerHabilidades();
            res.status(200).json(respuesta);
            return;
        }
        catch(error){
            res.status(400).json(error.message);
        }   
    }

    obtenerHabilidadPorId(req,res){
        const id = Number(req.params.id);
            
        try{
            const respuesta = HabilidadService.obtenerHabilidadPorId(id);    
            if(!respuesta){
                res.status(404).json("No se encontro la habilidad id : " + id);
                return;
            }
            res.status(200).json(respuesta);
        }
        catch(error){
            res.status(400).json(error.message);
        }
            
    }

}

export default new HabilidadController();