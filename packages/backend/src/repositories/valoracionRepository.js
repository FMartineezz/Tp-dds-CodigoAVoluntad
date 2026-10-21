import { ValoracionModel } from "../schemas/valoracionSchema.js";

export class ValoracionRepository {
    constructor() {
        this.model = ValoracionModel;
    }

    async guardar(valoracion) {
        const nuevaValoracion = new this.model(valoracion);
        return await nuevaValoracion.save();
    }

    async obtenerPorColaboracionIds(colaboracionIds) {
        return await this.model
            .find({ colaboracion: { $in: colaboracionIds } })
            .lean();
    }

    async obtenerPorColaboracionIdYEvaluador(colaboracionId, evaluador) {
        return await this.model.findOne({ colaboracion: colaboracionId, evaluador: evaluador }).lean();
    }

    async obtenerPorColaboracionId(colaboracionId) {
        return await this.model.findOne({ colaboracion: colaboracionId }).lean();
    }

    async obtenerPorPersonaColaboradoraId(personaColaboradoraId) {
        return await this.model.find({ evaluador: personaColaboradoraId }).lean();
    }

    async obtenerPorColectivoId(colectivoId) {
        return await this.model.find({ evaluador: colectivoId }).lean();
    }

}