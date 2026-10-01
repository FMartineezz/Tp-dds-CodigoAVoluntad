import { z as zod } from "zod";
import { AppError } from "../../errors/appError.js";
import ErrorCatalog from "../../errors/errorCatalog.js";
import ProyectoModel from "../../models/proyecto.js";

const { TipoCompromiso, ModalidadColaboracion } = ProyectoModel;

const proyectoSchema = zod.object({
    // zod.tipoDeDatoQueDeberiaSer({ required_error: CodigoSiEsteCampoNoViaja, invalid_type_error: CodigoSiViajaPeroConOtroTipoDeDato }).min(longitudMinima, CodigoSiNoLlegaAEsaLongitud)
    titulo: zod.string({ required_error: "PROYECTO_TITULO_REQUERIDO", invalid_type_error: "ARGUMENTO_INVALIDO" }).min(1, "PROYECTO_TITULO_REQUERIDO"),
    descripcion: zod.string({ required_error: "PROYECTO_DESCRIPCION_REQUERIDA", invalid_type_error: "ARGUMENTO_INVALIDO" }).min(1, "PROYECTO_DESCRIPCION_REQUERIDA"),
    // zod.array(zod.tipoDeDatoDeCadaElemento({ invalid_type_error: CodigoSiAlgunElementoNoCumpleEseTipo }), { required_error: CodigoSiEsteCampoNoViaja, invalid_type_error: CodigoSiNoEsUnArray })
    habilidadesRequeridas: zod.array(
        zod.string({ invalid_type_error: "PROYECTO_HABILIDADES_REQUERIDAS_FORMATO" }),
        { required_error: "PROYECTO_HABILIDADES_REQUERIDAS", invalid_type_error: "PROYECTO_HABILIDADES_REQUERIDAS_FORMATO" }
    ),
    // zod.number({ required_error: CodigoSiEsteCampoNoViaja, invalid_type_error: CodigoSiViajaPeroConOtroTipoDeDato })
    horas: zod.number({ required_error: "PROYECTO_HORAS_REQUERIDAS", invalid_type_error: "ARGUMENTO_INVALIDO" }),
    // zod.nativeEnum(EnumDeJS, { errorMap: (issue) => ({ message: issue.code === "invalid_type" ? CodigoSiEsteCampoNoViajaOEsOtroTipoDeDato : CodigoSiNoPerteneceAlEnum }) })
    tipoDeCompromiso: zod.nativeEnum(TipoCompromiso, {
        errorMap: (issue) => ({
            message: issue.code === "invalid_type" ? "PROYECTO_TIPO_COMPROMISO_REQUERIDO" : "PROYECTO_TIPO_COMPROMISO_INVALIDO",
        }),
    }),
    modalidadDeColaboracion: zod.nativeEnum(ModalidadColaboracion, {
        errorMap: (issue) => ({
            message: issue.code === "invalid_type" ? "PROYECTO_MODALIDAD_REQUERIDA" : "PROYECTO_MODALIDAD_INVALIDA",
        }),
    }),
    colectivo: zod.string({ required_error: "PROYECTO_COLECTIVO_REQUERIDO", invalid_type_error: "PROYECTO_COLECTIVO_FORMATO" }),
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
