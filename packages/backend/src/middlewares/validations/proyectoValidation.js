import ErrorCatalog from "../../errors/errorCatalog.js";

const validarProyecto = (req, res, next) => {

    const {
        titulo,
        descripcion,
        habilidadesRequeridas,
        horas,
        tipoDeCompromiso,
        modalidadDeColaboracion,
        colectivo
    } = req.body;

    if (!titulo) {
        return res.status(400).json(
            ErrorCatalog.PROYECTO_TITULO_REQUERIDO
        );
    }

    if (!descripcion) {
        return res.status(400).json(
            ErrorCatalog.PROYECTO_DESCRIPCION_REQUERIDA
        );
    }

    if (!habilidadesRequeridas) {
        return res.status(400).json(
            ErrorCatalog.PROYECTO_HABILIDADES_REQUERIDAS
        );
    }

     if (!Array.isArray(habilidadesRequeridas)) {
        return res.status(400).json(
            ErrorCatalog.PROYECTO_HABILIDADES_REQUERIDAS_FORMATO
        );
    }

    if (!habilidadesRequeridas.every(habilidad => typeof habilidad === "string")) {
        return res.status(400).json(
            ErrorCatalog.PROYECTO_HABILIDADES_REQUERIDAS_FORMATO
        );
    }

    if (!horas) {
        return res.status(400).json(
            ErrorCatalog.PROYECTO_HORAS_REQUERIDAS
        );
    }

    if (!tipoDeCompromiso) {
        return res.status(400).json(
            ErrorCatalog.PROYECTO_TIPO_COMPROMISO_REQUERIDO
        );
    }

    if (!modalidadDeColaboracion) {
        return res.status(400).json(
            ErrorCatalog.PROYECTO_MODALIDAD_REQUERIDA
        );
    }

    if (!colectivo) {
        return res.status(400).json(
            ErrorCatalog.PROYECTO_COLECTIVO_REQUERIDO
        );
    }

    if(typeof colectivo === 'object'){
        return res.status(400).json(
            ErrorCatalog.PROYECTO_COLECTIVO_FORMATO
        );
    }

    next();
};

export default validarProyecto;