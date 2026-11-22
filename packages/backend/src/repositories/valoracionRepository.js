import { ValoracionModel } from "../schemas/valoracionSchema.js";
import { AppError } from "../errors/appError.js";
import ErrorCatalog from "../errors/errorCatalog.js";

/** @typedef {import("../types.js").Id} Id */
/** @typedef {import("../types.js").ValoracionGuardada} ValoracionGuardada */
/** @typedef {import("../models/valoracion.js").Valoracion} Valoracion */
/** @typedef {import("../models/valoracion.js").TipoEvaluador[keyof typeof import("../models/valoracion.js").TipoEvaluador]} TipoEvaluadorValor */

/**
 * Valoración sin `autor` ni `destinatario` (la proyección de los listados no los trae).
 * @typedef {Pick<ValoracionGuardada, "_id" | "colaboracion" | "evaluador" | "puntaje" | "comentario" | "createdAt">} ValoracionResumida
 */

/**
 * Hacia dónde mirar las valoraciones de alguien: las que recibió, las que hizo o ambas.
 * @typedef {"recibidas" | "emitidas" | "todas"} DireccionValoracion
 */

/** Acceso a la colección de valoraciones. */
export class ValoracionRepository {
    constructor() {
        this.model = ValoracionModel;
    }

    /**
     * Guarda una valoración nueva.
     * @param {Valoracion} valoracion
     * @returns {Promise<import("mongoose").Document & ValoracionGuardada>} El documento de mongoose (sin lean).
     * @throws {AppError} VALORACION_EXISTENTE si ya hay una para esa colaboración y evaluador.
     */
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

    /**
     * Valoraciones de varias colaboraciones, opcionalmente filtradas por quién evaluó.
     * @param {Id[]} colaboracionIds
     * @param {{ evaluador?: TipoEvaluadorValor }} [opciones]
     * @returns {Promise<ValoracionResumida[]>}
     */
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

    /**
     * La valoración que hizo un evaluador sobre una colaboración, o null.
     * @param {Id} colaboracionId
     * @param {TipoEvaluadorValor} evaluador
     * @returns {Promise<ValoracionGuardada | null>}
     */
    async obtenerPorColaboracionIdYEvaluador(colaboracionId, evaluador) {
        return await this.model.findOne({ colaboracion: colaboracionId, evaluador: evaluador }).lean();
    }

    /**
     * Todas las valoraciones de una colaboración.
     * @param {Id} colaboracionId
     * @returns {Promise<ValoracionGuardada[]>}
     */
    async obtenerPorColaboracionId(colaboracionId) {
        return await this.model.find({ colaboracion: colaboracionId }).lean();
    }

    /**
     * Valoraciones de una persona colaboradora, según la dirección.
     * @param {Id} personaColaboradoraId
     * @param {{ direccion?: DireccionValoracion }} [opciones] Cualquier otro valor trae ambas.
     * @returns {Promise<ValoracionResumida[]>}
     */
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

    /**
     * Valoraciones de un colectivo, según la dirección.
     * @param {Id} colectivoId
     * @param {{ direccion?: DireccionValoracion }} [opciones] Cualquier otro valor trae ambas.
     * @returns {Promise<ValoracionResumida[]>}
     */
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
