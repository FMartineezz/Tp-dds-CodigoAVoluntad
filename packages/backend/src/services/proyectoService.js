import ProyectoModel from "../models/proyecto.js";
import proyectoRepository from "../repositories/proyectoRepository.js";
import { AppError } from "../errors/appError.js";
import ErrorCatalog from "../errors/errorCatalog.js";

class ProyectoService {

    crearProyecto(
        titulo,
        descripcion,
        habilidadesRequeridas,
        horas,
        tipoDeCompromiso,
        modalidadDeColaboracion,
        colectivo
    ) {

        const proyecto = new ProyectoModel.Proyecto(
            titulo,
            descripcion,
            habilidadesRequeridas,
            horas,
            tipoDeCompromiso,
            modalidadDeColaboracion,
            colectivo
        );

        return proyectoRepository.guardar(proyecto);
    }

    obtenerProyectos() {
        return proyectoRepository.obtenerTodos();
    }

    obtenerProyectoPorId(id) {

        const proyecto = proyectoRepository.obtenerPorId(id);

        if (!proyecto) {
            throw new AppError(
                ErrorCatalog.PROYECTO_NO_ENCONTRADO,
                404
            );
        }

        return proyecto;
    }

    finalizarProyecto(id) {
    const proyecto = proyectoRepository.obtenerPorId(id);

    if (!proyecto) {
        throw new AppError(
            ErrorCatalog.PROYECTO_NO_ENCONTRADO,
            404
        );
    }

    proyecto.finalizado = true;

    return proyecto;

    }

}

export default new ProyectoService();