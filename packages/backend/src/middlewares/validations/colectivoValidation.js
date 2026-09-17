import { AppError } from "../../errors/appError.js";
import ErrorCatalog from "../../errors/errorCatalog.js";
import {TipoColectivo } from "../../models/colectivo.js";
import validacion from "./funcionesDeValidacion.js"; 

const validarColectivo = (req, res, next) => {

    const {
        nombre,
        descripcion,
        ubicacion,
        tipoDeColectivo
    } = req.body;

    if (Lodash.isEmpty(nombre)) {
        throw new AppError(ErrorCatalog.COLECTIVO_NOMBRE_REQUERIDO,400);
    }

    if (!Lodash.isString(nombre)) {
        throw new AppError(ErrorCatalog.ARGUMENTO_INVALIDO, 400);
    }

    if (Lodash.isEmpty(descripcion)) {
        throw new AppError(ErrorCatalog.COLECTIVO_DESCRIPCION_REQUERIDA,400);
    }

     if (!Lodash.isString(descripcion)) {
        throw new AppError(ErrorCatalog.ARGUMENTO_INVALIDO, 400);
    }

    if (Lodash.isEmpty(tipoDeColectivo)) {
        throw new AppError(ErrorCatalog.COLECTIVO_TIPO_REQUERIDO,400);
    }

    if (typeof tipoDeColectivo !== "string") {
        throw new AppError(ErrorCatalog.ARGUMENTO_INVALIDO, 400);
    }

    if (!Object.values(TipoColectivo).includes(tipoDeColectivo)) {
        throw new AppError(ErrorCatalog.COLECTIVO_TIPO_INVALIDO, 400);
    }

    next();
};

export default validarColectivo;