import ErrorCatalog from "../../errors/errorCatalog.js";
import validacion from "./funcionesDeValidacion.js";

const validarColaboracion = (req, res, next) => {
  const { personaColaboradoraId, proyectoId } = req.body;

  validacion.esNil(
    personaColaboradoraId,
    ErrorCatalog.COLABORACION_PERSONA_REQUERIDA,
  );

  validacion.esNil(proyectoId, ErrorCatalog.COLABORACION_PROYECTO_REQUERIDO);

  next();
};

export default validarColaboracion;
