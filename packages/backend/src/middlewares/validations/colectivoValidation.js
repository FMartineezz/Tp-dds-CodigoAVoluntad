import { AppError } from "../../errors/appError.js";
import ErrorCatalog from "../../errors/errorCatalog.js";
import { UBICACION_VALIDA, TipoColectivo } from "../../models/colectivo.js";

const validarColectivo = (req, res, next) => {

    const {
        nombre,
        descripcion,
        ubicacion,
        tipoDeColectivo
    } = req.body;

    if (nombre === undefined || nombre === null || nombre === "") {
        throw new AppError(ErrorCatalog.COLECTIVO_NOMBRE_REQUERIDO,400);
    }

    if (typeof nombre !== "string") {
        throw new AppError(ErrorCatalog.ARGUMENTO_INVALIDO, 400);
    }

    if (descripcion === undefined || descripcion === null || descripcion === "") {
        throw new AppError(ErrorCatalog.COLECTIVO_DESCRIPCION_REQUERIDA,400);
    }

     if (typeof descripcion !== "string") {
        throw new AppError(ErrorCatalog.ARGUMENTO_INVALIDO, 400);
    }

/*  if (ubicacion !== undefined && ubicacion !== null && !UBICACION_VALIDA.has(ubicacion.toLowerCase())) {
        return res.status(400).json(ErrorCatalog.COLECTIVO_UBICACION_INVALIDA);
    }
*/
    if (tipoDeColectivo === undefined || tipoDeColectivo === null || tipoDeColectivo === "") {
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