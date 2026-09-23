import ErrorCatalog from "../../errors/errorCatalog.js";
import validacion from "./funcionesDeValidacion.js";
import { TipoCompromiso } from "../../models/proyecto.js";
import { ModalidadColaboracion } from "../../models/proyecto.js";

function validarPerfilData(perfil) {
  validacion.esStringRequerido(
    perfil.descripcion,
    ErrorCatalog.PERFIL_DESCRIPCION_REQUERIDO,
    ErrorCatalog.ARGUMENTO_INVALIDO,
    "descripcion del perfil",
  );

  validacion.esArrayDeStringsConMinimo(
    perfil.habilidadesRequeridas,
    1,
    ErrorCatalog.PERFIL_HABILIDADES_REQUERIDAS,
    ErrorCatalog.PERFIL_HABILIDADES_REQUERIDAS_FORMATO,
  );

  validacion.esArrayDeStringsConMinimo(
    perfil.habilidadesOpcionales,
    1,
    ErrorCatalog.PERFIL_HABILIDADES_OPCIONALES,
    ErrorCatalog.PERFIL_HABILIDADES_OPCIONALES_FORMATO,
  );

  validacion.esNumeroRequerido(
    perfil.horas,
    ErrorCatalog.PERFIL_HORAS_REQUERIDAS,
    ErrorCatalog.ARGUMENTO_INVALIDO,
    "horas",
  );

  validacion.esValorPermitidoRequerido(
    perfil.tipoDeCompromiso,
    TipoCompromiso,
    ErrorCatalog.PERFIL_TIPO_COMPROMISO_REQUERIDO,
    ErrorCatalog.PERFIL_TIPO_COMPROMISO_FORMATO,
  );

  validacion.esValorPermitidoRequerido(
    perfil.modalidadDeColaboracion,
    ModalidadColaboracion,
    ErrorCatalog.PERFIL_MODALIDAD_REQUERIDA,
    ErrorCatalog.PERFIL_MODALIDAD_FORMATO,
  );
}

const validarProyecto = (req, res, next) => {
  const { titulo, descripcion, perfiles, colectivo } = req.body;

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

  //Valido los perfiles

  validacion.esNil(perfiles, ErrorCatalog.PROYECTO_PERFILES_REQUERIDOS);
  if (!Array.isArray(perfiles) || perfiles.length === 0) {
    throw new AppError(ErrorCatalog.PROYECTO_PERFILES_REQUERIDOS, 400);
  }
  perfiles.forEach(validarPerfilData);

  validacion.esNil(colectivo, ErrorCatalog.PROYECTO_COLECTIVO_REQUERIDO);

  if (typeof colectivo === "object") {
    return res.status(400).json(ErrorCatalog.PROYECTO_COLECTIVO_FORMATO);
  }

  next();
};

export default validarProyecto;
