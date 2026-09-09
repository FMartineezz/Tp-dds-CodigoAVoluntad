import proyectoServiceDefault from "../services/proyectoService.js";

class ProyectoController {
    constructor(proyectoService = proyectoServiceDefault){
        this.proyectoService = proyectoService;
    }

    crearProyecto = (req, res) => {
        const proyecto = this.proyectoService.crearProyecto(
            req.body.titulo,
            req.body.descripcion,
            req.body.habilidadesRequeridas,
            req.body.horas,
            req.body.tipoDeCompromiso,
            req.body.modalidadDeColaboracion,
            req.body.colectivo
        );
        res.status(201).location(`/proyectos/${proyecto.id}`).json(proyecto);

    }

    obtenerProyectos = (req, res) => {
        const proyectos = this.proyectoService.obtenerProyectos();

        res.status(200).json(proyectos);

    }

    obtenerProyectoPorId = (req, res) => {
        const id = Number(req.params.id);

        const proyecto = this.proyectoService.obtenerProyectoPorId(id);

        res.status(200).json(proyecto);

    }

    finalizarProyecto = (req, res, next) =>{
        const id = Number(req.params.id);

        const proyecto = this.proyectoService.finalizarProyecto(id);

        res.status(200).json(proyecto);
    }

    // Alternativa recurso-céntrica a /finalizar (ver issue REST): PATCH /proyectos/:id { finalizado: true }
    actualizarProyecto = (req, res) => {
        const id = Number(req.params.id);

        const proyecto = this.proyectoService.actualizarProyecto(id, req.body);

        res.status(200).json(proyecto);
    }

}

export default new ProyectoController();