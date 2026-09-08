import ErrorCatalog from "../../errors/errorCatalog.js";

const validarColaboracion = (req, res, next) => {

    const {
        personaColaboradora,
        proyecto
    } = req.body;

    if (personaColaboradora === undefined || personaColaboradora === null) {
        return res.status(400).json(
            ErrorCatalog.COLABORACION_PERSONA_REQUERIDA
        );
    }

    if (proyecto === undefined || proyecto === null) {
        return res.status(400).json(
            ErrorCatalog.COLABORACION_PROYECTO_REQUERIDO
        );
    }

    next();
};

export default validarColaboracion;