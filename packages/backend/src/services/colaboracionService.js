import ColaboracionModel from "../models/colaboracion.js";
import colaboracionRepositoryDefault from "../repositories/colaboracionRepository.js";
import personaColaboradoraServiceDefault from "./PersonaColaboradoraService.js";
import proyectoServiceDefault from "./proyectoService.js";
import { AppError } from "../errors/appError.js";
import ErrorCatalog from "../errors/errorCatalog.js";

class ColaboracionService {
    constructor(
        colaboracionRepository = colaboracionRepositoryDefault,
        personaColaboradoraService = personaColaboradoraServiceDefault,
        proyectoService = proyectoServiceDefault
    ) {
        this.colaboracionRepository = colaboracionRepository;
        this.personaColaboradoraService = personaColaboradoraService;
        this.proyectoService = proyectoService;
    }

    crearColaboracion(personaId, proyectoId) {
        const persona = this.personaColaboradoraService.obtenerPersonaColaboradoraPorId(personaId);

        const proyecto = this.proyectoService.obtenerProyectoPorId(proyectoId);

        if (proyecto.finalizado) {
            throw new AppError(ErrorCatalog.COLABORACION_PROYECTO_FINALIZADO, 400, proyectoId);
        }

        const tieneHabilidadRequerida =
            persona.habilidades.some(habilidadPersona =>
                proyecto.habilidadesRequeridas.some(habilidadProyecto => habilidadPersona.codigo === habilidadProyecto.codigo)
            );

        if (!tieneHabilidadRequerida) {
            throw new AppError(ErrorCatalog.COLABORACION_HABILIDAD_REQUERIDA, 400);
        }

        const colaboracion = new ColaboracionModel.Colaboracion(persona, proyecto);

        return this.colaboracionRepository.guardar(colaboracion);
    }

    obtenerColaboraciones() {
        return this.colaboracionRepository.obtenerTodas();
    }

    obtenerColaboracionPorId(id) {
        const colaboracion = this.colaboracionRepository.obtenerPorId(id);

        if (!colaboracion) {
            throw new AppError(ErrorCatalog.COLABORACION_NO_ENCONTRADA, 404, id);
        }

        return colaboracion;
    }
}

export default new ColaboracionService();