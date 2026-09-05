//En vez de escribir muchos trycatch se puede hacer un middleware de manejo de errores
export class HabilidadController {
    constructor(habilidadService){
        this.habilidadService = habilidadService;
    }

    crearHabilidad = (req, res) => {
        try{
            const respuesta = this.habilidadService.crearHabilidad(req.body.titulo, req.body.descripcion);
            res.status(201).json(respuesta);
            return; 
        }
        catch (error){
            res.status(400).json("Error al crear la habilidad: " + error.message);
        }
    }

    obtenerHabilidades = (req,res) => {
        try{
            const respuesta = this.habilidadService.obtenerHabilidades();
            res.status(200).json(respuesta);
            return;
        }
        catch(error){
            res.status(400).json(error.message);
        }   
    }

    obtenerHabilidadPorId = (req,res) => {
        const id = Number(req.params.id);
            
        try{
            const respuesta = this.habilidadService.obtenerHabilidadPorId(id);    
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