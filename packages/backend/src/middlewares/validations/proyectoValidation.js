import { z as zod } from "zod";
import { AppError } from "../../errors/appError.js";
import ErrorCatalog from "../../errors/errorCatalog.js";
import { TipoCompromiso, ModalidadColaboracion } from "../../models/proyecto.js";

// NUEVO: lo que antes estaba en validarPerfilData, ahora como schema de un perfil
export const perfilSchema = zod.object({
  descripcion: zod
    .string({
      required_error: "PERFIL_DESCRIPCION_REQUERIDO",
      invalid_type_error: "ARGUMENTO_INVALIDO",
    })
    .min(1, "PERFIL_DESCRIPCION_REQUERIDO"),
  habilidadesRequeridas: zod
    .array(zod.string({ invalid_type_error: "PERFIL_HABILIDADES_REQUERIDAS_FORMATO" }), {
      required_error: "PERFIL_HABILIDADES_REQUERIDAS",
      invalid_type_error: "PERFIL_HABILIDADES_REQUERIDAS_FORMATO",
    })
    .min(1, "PERFIL_HABILIDADES_REQUERIDAS"),
  habilidadesOpcionales: zod
    .array(zod.string({ invalid_type_error: "PERFIL_HABILIDADES_OPCIONALES_FORMATO" }), {
      required_error: "PERFIL_HABILIDADES_OPCIONALES",
      invalid_type_error: "PERFIL_HABILIDADES_OPCIONALES_FORMATO",
    })
    .min(1, "PERFIL_HABILIDADES_OPCIONALES"),
  horas: zod.number({
    required_error: "PERFIL_HORAS_REQUERIDAS",
    invalid_type_error: "ARGUMENTO_INVALIDO",
  }),
  tipoDeCompromiso: zod.nativeEnum(TipoCompromiso, {
    errorMap: (issue) => ({
      message:
        issue.code === "invalid_type"
          ? "PERFIL_TIPO_COMPROMISO_REQUERIDO"
          : "PERFIL_TIPO_COMPROMISO_FORMATO",
    }),
  }),
  modalidadDeColaboracion: zod.nativeEnum(ModalidadColaboracion, {
    errorMap: (issue) => ({
      message:
        issue.code === "invalid_type" ? "PERFIL_MODALIDAD_REQUERIDA" : "PERFIL_MODALIDAD_FORMATO",
    }),
  }),
});

const proyectoSchema = zod.object({
  titulo: zod
    .string({
      required_error: "PROYECTO_TITULO_REQUERIDO",
      invalid_type_error: "ARGUMENTO_INVALIDO",
    })
    .min(1, "PROYECTO_TITULO_REQUERIDO"),
  descripcion: zod
    .string({
      required_error: "PROYECTO_DESCRIPCION_REQUERIDA",
      invalid_type_error: "ARGUMENTO_INVALIDO",
    })
    .min(1, "PROYECTO_DESCRIPCION_REQUERIDA"),
  // NUEVO: array de perfiles, con al menos uno
  perfiles: zod
    .array(perfilSchema, {
      required_error: "PROYECTO_PERFILES_REQUERIDOS",
      invalid_type_error: "PROYECTO_PERFILES_REQUERIDOS",
    })
    .min(1, "PROYECTO_PERFILES_REQUERIDOS"),
  colectivo: zod.string({
    required_error: "PROYECTO_COLECTIVO_REQUERIDO",
    invalid_type_error: "PROYECTO_COLECTIVO_FORMATO",
  }),
});

const validarProyecto = (req, res, next) => {
  const resultado = proyectoSchema.safeParse(req.body);

  if (!resultado.success) {
    const codigo = resultado.error.issues[0].message;
    throw new AppError(ErrorCatalog[codigo], 400);
  }

  next();
};

export default validarProyecto;
