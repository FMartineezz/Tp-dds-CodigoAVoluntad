import { ValoracionModel } from "../schemas/valoracionSchema.js";
import { AppError } from "../errors/appError.js";
import ErrorCatalog from "../errors/errorCatalog.js";

export class ValoracionRepository {
    constructor() {
        this.model = ValoracionModel;
    }

    async guardar(valoracion) {
        try {
            const nuevaValoracion = new this.model(valoracion);
            return await nuevaValoracion.save();
        } catch (error) {
            if (error.code === 11000) {
                throw new AppError(
                    ErrorCatalog.VALORACION_EXISTENTE,
                    400,
                    valoracion.colaboracion,
                    valoracion.evaluador,
                );
            }
            throw error;
        }
    }

    async obtenerPorColaboracionIds(colaboracionIds, { evaluador } = {}) {
        const query = { colaboracion: { $in: colaboracionIds } };
        if (evaluador) {
            query.evaluador = evaluador;
        }
        return await this.model
            .find(query, {
                _id: 1,
                colaboracion: 1,
                evaluador: 1,
                puntaje: 1,
                comentario: 1,
                createdAt: 1,
            })
            .lean();
    }

    async obtenerPorColaboracionIdYEvaluador(colaboracionId, evaluador) {
        return await this.model.findOne({ colaboracion: colaboracionId, evaluador: evaluador }).lean();
    }

    async obtenerPorColaboracionId(colaboracionId) {
        return await this.model.find({ colaboracion: colaboracionId }).lean();
    }

    async obtenerPorPersonaColaboradoraId(personaColaboradoraId, { direccion = "recibidas" } = {}) {
        const query = direccion === "recibidas"
            ? { destinatario: personaColaboradoraId }
            : direccion === "emitidas"
            ? { autor: personaColaboradoraId }
            : { $or: [{ destinatario: personaColaboradoraId }, { autor: personaColaboradoraId }] };
        return await this.model
            .find(query, {
                _id: 1,
                colaboracion: 1,
                evaluador: 1,
                puntaje: 1,
                comentario: 1,
                createdAt: 1,
            })
            .lean();
    }

    async obtenerPorColectivoId(colectivoId, { direccion = "recibidas" } = {}) {
        const query = direccion === "recibidas"
            ? { destinatario: colectivoId }
            : direccion === "emitidas"
            ? { autor: colectivoId }
            : { $or: [{ destinatario: colectivoId }, { autor: colectivoId }] };
        return await this.model
            .find(query, {
                _id: 1,
                colaboracion: 1,
                evaluador: 1,
                puntaje: 1,
                comentario: 1,
                createdAt: 1,
            })
            .lean();
    }

}