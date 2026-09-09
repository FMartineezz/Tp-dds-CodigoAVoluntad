import colaboracionServiceDefault from "../services/colaboracionService.js";

class ColaboracionController {
    constructor(colaboracionService = colaboracionServiceDefault) {
        this.colaboracionService = colaboracionService;
    }

    crearColaboracion = (req, res) => {
        const colaboracion =
                this.colaboracionService.crearColaboracion(req.body.personaColaboradoraId, req.body.proyectoId);

        res.status(201).location(`/colaboraciones/${colaboracion.id}`).json(colaboracion);
    }

    obtenerColaboraciones = (req, res) => {
        const colaboraciones = this.colaboracionService.obtenerColaboraciones();

        res.status(200).json(colaboraciones);

    }

    obtenerColaboracionPorId = (req, res) => {
        const id = Number(req.params.id);

        const colaboracion =this.colaboracionService.obtenerColaboracionPorId(id);

        res.status(200).json(colaboracion);
    }
}

export default new ColaboracionController();