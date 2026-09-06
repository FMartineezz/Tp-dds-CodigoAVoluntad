import ErrorCatalog from "../../errors/ErrorCatalog.js";

const validarColaboradora = (req, res, next) => {

    const {
        nombreFantasia,
        git,
        habilidades,
        presentacion
    } = req.body;

    if (nombreFantasia === undefined || nombreFantasia === null || nombreFantasia === "") {
        return res.status(400).json(
            ErrorCatalog.COLABORADORA_NOMBRE_FANTASIA_REQUERIDO
        );
    }

    if (git === undefined || git === null || git === "") {
        return res.status(400).json(
            ErrorCatalog.COLABORADORA_GIT_REQUERIDO
        );
    }

    if (habilidades === undefined || habilidades === null) {
        return res.status(400).json(
            ErrorCatalog.COLABORADORA_HABILIDADES_REQUERIDAS
        );
    }

    if (presentacion === undefined || presentacion === null || presentacion === "") {
        return res.status(400).json(
            ErrorCatalog.COLABORADORA_PRESENTACION_REQUERIDA
        );
    }

    next();
};

export default validarColaboradora;