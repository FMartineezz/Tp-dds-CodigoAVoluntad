import ErrorCatalog from "../../errors/errorCatalog.js";

const validarColaboracion = (req, res, next) => {

    const {
        personaColaboradoraId,
        proyectoId
    } = req.body;

    if (personaColaboradoraId === undefined || personaColaboradoraId === null) {
        return res.status(400).json(
            ErrorCatalog.COLABORACION_PERSONA_REQUERIDA
        );
    }

    if (proyectoId === undefined || proyectoId === null) {
        return res.status(400).json(
            ErrorCatalog.COLABORACION_PROYECTO_REQUERIDO
        );
    }

    next();
};

export default validarColaboracion;