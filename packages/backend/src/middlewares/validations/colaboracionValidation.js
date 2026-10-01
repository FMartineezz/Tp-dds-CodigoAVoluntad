import { z as zod } from "zod";
import ErrorCatalog from "../../errors/errorCatalog.js";
import { AppError } from "../../errors/appError.js";

const colaboracionSchema = zod.object({
    // zod.any().refine(valor => condicionQueDeberiaCumplir, { message: CodigoSiLaCondicionDaFalse }) -> para validaciones a medida que no tienen un método propio en zod (ojo: zod.any() acepta undefined, así que el chequeo de "requerido" tiene que ir adentro del refine)
    personaColaboradoraId: zod.any().refine((valor) => valor !== undefined && valor !== null, { message: "COLABORACION_PERSONA_REQUERIDA" }),
    proyectoId: zod.any().refine((valor) => valor !== undefined && valor !== null, { message: "COLABORACION_PROYECTO_REQUERIDO" }),
});

const validarColaboracion = (req, res, next) => {

    const resultado = colaboracionSchema.safeParse(req.body);

    if (!resultado.success) {
        const codigo = resultado.error.issues[0].message;
        throw new AppError(ErrorCatalog[codigo], 400);
    }

    next();
};

export default validarColaboracion;
