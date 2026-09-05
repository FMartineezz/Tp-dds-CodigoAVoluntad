import ErrorCatalog from "../../errors/ErrorCatalog.js";
import { UBICACION_VALIDA, TipoColectivo } from "../../models/entities/colectivo.js";

const validarColectivo = (req, res, next) => {

    const {
        nombre,
        descripcion,
        ubicacion,
        tipoDeColectivo
    } = req.body;

    if (nombre === undefined || nombre === null || nombre === "") {
        return res.status(400).json(
            ErrorCatalog.COLECTIVO_NOMBRE_REQUERIDO
        );
    }

    if (descripcion === undefined || descripcion === null || descripcion === "") {
        return res.status(400).json(
            ErrorCatalog.COLECTIVO_DESCRIPCION_REQUERIDA
        );
    }

    if (
        ubicacion !== undefined &&
        ubicacion !== null &&
        !UBICACION_VALIDA.has(ubicacion.toLowerCase())
    ) {
        return res.status(400).json(
            ErrorCatalog.COLECTIVO_UBICACION_INVALIDA
        );
    }

    if (tipoDeColectivo === undefined || tipoDeColectivo === null || tipoDeColectivo === "") {
        return res.status(400).json(
            ErrorCatalog.COLECTIVO_TIPO_REQUERIDO
        );
    }

    next();
};

export default validarColectivo;