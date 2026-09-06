class ColectivoController {
    constructor(service){
        this.service = service
    }

    crearColectivo(req, res) {
        try{
            const respuesta = this.service.crearColectivo(
                req.body.nombre, 
                req.body.descripcion, 
                req.body.ubicacion, 
                req.body.tipoDeColectivo, 
                req.body.proyectos
            );
            res.status(201).json(respuesta);
            return; 
        }
        catch (error){
            res.status(400).json("Error al crear el colectivo: " + error.message);
        }
    }

    obtenerColectivos(req,res){
        try{
            const respuesta = this.service.obtenerColectivos();
            res.status(200).json(respuesta);
            return;
        }
        catch(error){
            res.status(400).json(error.message);
        }   
    }

    obtenerColectivoPorId(req,res){
        const id = Number(req.params.id);
            
        try{
            const respuesta = this.service.obtenerColectivoPorId(id);    
            if(!respuesta){
                res.status(404).json("No se encontro el colectivo id : " + id);
                return;
            }
            res.status(200).json(respuesta);
        }
        catch(error){
            res.status(400).json(error.message);
        }
            
    }

}

export default ColectivoController;