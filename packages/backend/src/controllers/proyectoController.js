import proyectoService from "../services/proyectoService.js";

class ProyectoController {
    crearProyecto(req, res, next) {
        try {
            const proyecto = proyectoService.crearProyecto(
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

    obtenerProyectos(req, res, next) {
        try {
            const proyectos =
                proyectoService.obtenerProyectos();

            res.status(200).json(proyectos);

        } catch (error) {
            next(error);
        }
    }

    obtenerProyectoPorId(req, res, next) {
        try {
            const id = Number(req.params.id);

            const proyecto =
                proyectoService.obtenerProyectoPorId(id);

            res.status(200).json(proyecto);

        } catch (error) {
            next(error);
        }
    }
}

export default new ProyectoController();