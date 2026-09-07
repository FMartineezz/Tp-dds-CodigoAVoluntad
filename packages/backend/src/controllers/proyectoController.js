import proyectoServiceDefault from "../services/proyectoService.js";

//ARREGLAR varias cosas del proyecto (Hay que validar que exista la habilidad y el proyecto)

class ProyectoController {
    constructor(proyectoService = proyectoServiceDefault){
        this.proyectoService = proyectoService;
    }

    crearProyecto = (req, res, next) => {
        try {
            const proyecto = this.proyectoService.crearProyecto(
                req.body.titulo,
                req.body.descripcion,
                req.body.habilidadesRequeridas,
                req.body.horas,
                req.body.tipoDeCompromiso,
                req.body.modalidadDeColaboracion,
                req.body.colectivo
            );
            res.status(201).json(proyecto);

        } catch (error) {
            next(error);
        }
    }

    obtenerProyectos = (req, res, next) => {
        try {
            const proyectos =
                this.proyectoService.obtenerProyectos();

            res.status(200).json(proyectos);

        } catch (error) {
            next(error);
        }
    }

    obtenerProyectoPorId = (req, res, next) => {
        try {
            const id = Number(req.params.id);

            const proyecto =
                this.proyectoService.obtenerProyectoPorId(id);

            res.status(200).json(proyecto);

        } catch (error) {
            next(error);
        }
    }
}

export default new ProyectoController();