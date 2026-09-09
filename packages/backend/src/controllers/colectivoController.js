import serviceDefault from "../services/colectivoService.js";

class ColectivoController {
    constructor(service = serviceDefault){
        this.service = service
    }

    crearColectivo(req, res) {
        const respuesta = this.service.crearColectivo(
                req.body.nombre, 
                req.body.descripcion, 
                req.body.ubicacion, 
                req.body.tipoDeColectivo, 
                req.body.proyectos
            );
        res.status(201).location(`/colectivos/${respuesta.id}`).json(respuesta);
    }

    obtenerColectivos(req,res){
            const respuesta = this.service.obtenerColectivos();
            res.status(200).json(respuesta);
    }

    obtenerColectivoPorId(req,res){
        const id = Number(req.params.id);
            
        const respuesta = this.service.obtenerColectivoPorId(id);    
        res.status(200).json(respuesta);
    
    }

}

export default new ColectivoController();