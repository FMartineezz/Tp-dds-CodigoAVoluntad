export class AppError extends Error {

    constructor(error, statusCode = 400) {
        super(error.message);

        this.name = "AppError";
        this.code = error.code;
        this.statusCode = statusCode;
    }

}
