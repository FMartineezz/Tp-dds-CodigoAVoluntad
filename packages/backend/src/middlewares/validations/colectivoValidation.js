import { z as zod } from "zod";
import { AppError } from "../../errors/appError.js";
import ErrorCatalog from "../../errors/errorCatalog.js";
import { UBICACION_VALIDA, TipoColectivo } from "../../models/colectivo.js";

const colectivoSchema = zod.object({
    // zod.tipoDeDatoQueDeberiaSer({ required_error: CodigoSiEsteCampoNoViaja, invalid_type_error: CodigoSiViajaPeroConOtroTipoDeDato }).min(longitudMinima, CodigoSiNoLlegaAEsaLongitud)
    nombre: zod.string({ required_error: "COLECTIVO_NOMBRE_REQUERIDO", invalid_type_error: "ARGUMENTO_INVALIDO" }).min(1, "COLECTIVO_NOMBRE_REQUERIDO"),
    descripcion: zod.string({ required_error: "COLECTIVO_DESCRIPCION_REQUERIDA", invalid_type_error: "ARGUMENTO_INVALIDO" }).min(1, "COLECTIVO_DESCRIPCION_REQUERIDA"),
    // zod.nativeEnum(EnumDeJS, { errorMap: (issue) => ({ message: issue.code === "invalid_type" ? CodigoSiEsteCampoNoViajaOEsOtroTipoDeDato : CodigoSiNoPerteneceAlEnum }) })
    tipoDeColectivo: zod.nativeEnum(TipoColectivo, {
        errorMap: (issue) => ({
            message: issue.code === "invalid_type" ? "COLECTIVO_TIPO_REQUERIDO" : "COLECTIVO_TIPO_INVALIDO",
        }),
    }),
});

const validarColectivo = (req, res, next) => {

    const resultado = colectivoSchema.safeParse(req.body);

    if (!resultado.success) {
        const codigo = resultado.error.issues[0].message;
        throw new AppError(ErrorCatalog[codigo], 400);
    }

/*  if (ubicacion !== undefined && ubicacion !== null && !UBICACION_VALIDA.has(ubicacion.toLowerCase())) {
        return res.status(400).json(ErrorCatalog.COLECTIVO_UBICACION_INVALIDA);
    }
*/

    next();
};

export default validarColectivo;
