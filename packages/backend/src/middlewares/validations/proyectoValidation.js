import ErrorCatalog from "../../errors/errorCatalog.js";
import validacion from "./funcionesDeValidacion.js";

const validarProyecto = (req, res, next) => {
  const {
    titulo,
    descripcion,
    habilidadesRequeridas,
    horas,
    tipoDeCompromiso,
    modalidadDeColaboracion,
    colectivo,
  } = req.body;

  validacion.esStringRequerido(
    titulo,
    ErrorCatalog.PROYECTO_TITULO_REQUERIDO,
    ErrorCatalog.ARGUMENTO_INVALIDO,
    "titulo",
  );

  validacion.esStringRequerido(
    descripcion,
    ErrorCatalog.PROYECTO_DESCRIPCION_REQUERIDA,
    ErrorCatalog.ARGUMENTO_INVALIDO,
    "descripcion",
  );

  validacion.esNil(habilidadesRequeridas, ErrorCatalog.PROYECTO_HABILIDADES_REQUERIDAS);

  validacion.esArrayDeStrings(
    habilidadesRequeridas,
    ErrorCatalog.PROYECTO_HABILIDADES_REQUERIDAS_FORMATO,
  );

  validacion.esNumeroRequerido(
    horas,
    ErrorCatalog.PROYECTO_HORAS_REQUERIDAS,
    ErrorCatalog.ARGUMENTO_INVALIDO,
    "horas",
  );

  validacion.esNil(tipoDeCompromiso, ErrorCatalog.PROYECTO_TIPO_COMPROMISO_REQUERIDO);

  validacion.esNil(modalidadDeColaboracion, ErrorCatalog.PROYECTO_MODALIDAD_REQUERIDA);

  validacion.esNil(colectivo, ErrorCatalog.PROYECTO_COLECTIVO_REQUERIDO);

  if (typeof colectivo === "object") {
    return res.status(400).json(ErrorCatalog.PROYECTO_COLECTIVO_FORMATO);
  }

  next();
};

export default validarProyecto;
