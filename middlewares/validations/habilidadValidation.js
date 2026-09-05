import ErrorCatalog from "../../errors/ErrorCatalog.js";

const validarHabilidad = (req, res, next) => {

    const { titulo, descripcion } = req.body;

    if (titulo === undefined || titulo === null || titulo === "") {
        return res.status(400).json(
            ErrorCatalog.HABILIDAD_TITULO_REQUERIDO
        );
    }

    if (descripcion === undefined || descripcion === null || descripcion === "") {
        return res.status(400).json(
            ErrorCatalog.HABILIDAD_DESCRIPCION_REQUERIDA
        );
    }

    next();
};

export default validarHabilidad;