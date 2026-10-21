import { Valoracion } from "../models/valoracion.js";
import { AppError } from "../errors/appError.js";
import ErrorCatalog from "../errors/errorCatalog.js";

export class ValoracionService {
    constructor({valoracionRepository, colaboracionRepository, proyectoRepository,
    }) {
    this.valoracionRepository = valoracionRepository;
    this.colaboracionRepository = colaboracionRepository;
    this.proyectoRepository = proyectoRepository;
    }

    async crearValoracion(colaboracionId, evaluador, puntaje, comentario) {
        const colaboracion = await this.colaboracionRepository.obtenerPorId(colaboracionId);
        if (!colaboracion) {
            throw new AppError(
                ErrorCatalog.COLABORACION_NO_EXISTENTE,
                404,
                `No existe una colaboración con id ${colaboracionId}`,
            );
        }

        const valoracionExistente = await this.valoracionRepository.obtenerPorColaboracionIdYEvaluador(colaboracionId, evaluador);
        if (valoracionExistente) {
            throw new AppError(
                ErrorCatalog.VALORACION_EXISTENTE,
                400,
                `Ya existe una valoración para la colaboración con id ${colaboracionId} y el evaluador ${evaluador}`
            );
        }

        const valoracion = new Valoracion(colaboracionId, evaluador, puntaje, comentario);
        return await this.valoracionRepository.guardar(valoracion);
    }

    async obtenerValoracionesPersona(personaColaboradoraId) {
        const colaboraciones =
            await this.colaboracionRepository.obtenerPorPersonaColaboradoraId(
            personaColaboradoraId,
            );

        const colaboracionIds = colaboraciones.map((c) => c._id);

        return await this.valoracionRepository.obtenerPorColaboracionIds(
            colaboracionIds,
        );
    }

    async obtenerValoracionesColectivo(colectivoId) {
        const proyectos =
            await this.proyectoRepository.obtenerPorColectivoId(colectivoId);

        const proyectoIds = proyectos.map((p) => p._id);

        const colaboraciones =
            await this.colaboracionRepository.obtenerPorProyectoIds(proyectoIds);

        const colaboracionIds = colaboraciones.map((c) => c._id);

        return await this.valoracionRepository.obtenerPorColaboracionIds(
            colaboracionIds,
        );
    }
}