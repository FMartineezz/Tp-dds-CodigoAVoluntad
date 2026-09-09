export class AppError extends Error {

    constructor(error, statusCode = 400, ...args) {
         super(
            typeof error.message === "function"
                ? error.message(...args)
                : error.message
        );

        this.code = error.code;
        this.statusCode = statusCode;
    }

}
