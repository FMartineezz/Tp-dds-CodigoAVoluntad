//En vez de escribir muchos trycatch se puede hacer un middleware de manejo de errores
export class HabilidadController {
    constructor(habilidadService){
        this.habilidadService = habilidadService;
    }

    crearHabilidad = (req, res) => {
        const respuesta = this.habilidadService.crearHabilidad(req.body.titulo, req.body.descripcion);
        res.status(201).json(respuesta);
    }

    obtenerHabilidades = (req,res) => {
        const respuesta = this.habilidadService.obtenerHabilidades();
        res.status(200).json(respuesta); 
    }

    obtenerHabilidadPorId = (req,res) => {
        const id = Number(req.params.id);
            
        const respuesta = this.habilidadService.obtenerHabilidadPorId(id);
        res.status(200).json(respuesta);
    }

}