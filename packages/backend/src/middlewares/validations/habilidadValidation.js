import ErrorCatalog from "../../errors/errorCatalog.js";

const validarHabilidad = (req, res, next) => {

    const { titulo, descripcion } = req.body;

    if (titulo === undefined || titulo === null || titulo === "") {
        throw new AppError(ErrorCatalog.HABILIDAD_TITULO_REQUERIDO, 400);
    }

    if (typeof titulo !== "string") {
        throw new AppError(ErrorCatalog.ARGUMENTO_INVALIDO, 400);
    }

    if (descripcion === undefined || descripcion === null || descripcion === "") {
        throw new AppError(ErrorCatalog.HABILIDAD_DESCRIPCION_REQUERIDA, 400);
    }

      if (typeof descripcion !== "string") {
        throw new AppError(ErrorCatalog.ARGUMENTO_INVALIDO, 400);
    }


    next();
};

export default validarHabilidad;