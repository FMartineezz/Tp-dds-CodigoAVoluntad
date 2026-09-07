import { AppError } from "../errors/appError.js";
import ErrorCatalog from "../errors/errorCatalog.js";

const errorHandler = (error, req, res, next) => {

    if (error instanceof AppError) {
        return res.status(error.statusCode).json({
            code: error.code,
            message: error.message
        });
    }

    console.error(error);

    const errorInterno = ErrorCatalog.ERROR_INTERNO;

    return res.status(500).json({
        code: errorInterno.code,
        message: errorInterno.message
    });
};

export default errorHandler;