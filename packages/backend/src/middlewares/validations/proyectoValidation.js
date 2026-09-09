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

    if (titulo === undefined || titulo === null || titulo === "") {
        return res.status(400).json(
            ErrorCatalog.PROYECTO_TITULO_REQUERIDO
        );
    }

    if (typeof titulo !== "string") {
    return res.status(400).json(
        ErrorCatalog.ARGUMENTO_INVALIDO
    );
}

    if (descripcion === undefined || descripcion === null || descripcion === "") {
        return res.status(400).json(
            ErrorCatalog.PROYECTO_DESCRIPCION_REQUERIDA
        );
    }

    if (typeof descripcion !== "string") {
    return res.status(400).json(
        ErrorCatalog.ARGUMENTO_INVALIDO
    );
}

    if (habilidadesRequeridas === undefined || habilidadesRequeridas === null) {
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

    if (horas === undefined || horas === null) {
        return res.status(400).json(
            ErrorCatalog.PROYECTO_HORAS_REQUERIDAS
        );
    }

    if (typeof horas !== "number") {
        return res.status(400).json(
            ErrorCatalog.ARGUMENTO_INVALIDO
        );
    }

    if (tipoDeCompromiso === undefined || tipoDeCompromiso === null) {
        return res.status(400).json(
            ErrorCatalog.PROYECTO_TIPO_COMPROMISO_REQUERIDO
        );
    }

    if (modalidadDeColaboracion === undefined || modalidadDeColaboracion === null) {
        return res.status(400).json(
            ErrorCatalog.PROYECTO_MODALIDAD_REQUERIDA
        );
    }

    if (colectivo === undefined || colectivo === null) {
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