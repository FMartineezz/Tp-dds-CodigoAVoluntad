import { AppError } from "../../errors/appError.js";
import ErrorCatalog from "../../errors/errorCatalog.js";
import { perfilSchema } from "./proyectoValidation.js";

const validarPerfil = (req, res, next) => {
  const resultado = perfilSchema.safeParse(req.body);

  if (!resultado.success) {
    const codigo = resultado.error.issues[0].message;
    throw new AppError(ErrorCatalog[codigo], 400);
  }

  next();
};

export default validarPerfil;
