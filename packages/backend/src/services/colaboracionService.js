import { Colaboracion } from "../models/colaboracion.js";
import { AppError } from "../errors/appError.js";
import ErrorCatalog from "../errors/errorCatalog.js";
import { EstadoColaboracion, OrigenBaja } from "../models/colaboracion.js";

export class ColaboracionService {
  constructor({ colaboracionRepository, personaColaboradoraService, proyectoService }) {
    this.colaboracionRepository = colaboracionRepository;
    this.personaColaboradoraService = personaColaboradoraService;
    this.proyectoService = proyectoService;
  }

  async crearColaboracion(personaId, proyectoId, perfilId, anonima) {
    const persona =
      await this.personaColaboradoraService.obtenerPersonaColaboradoraPorId(personaId);
    const proyecto = await this.proyectoService.obtenerProyectoPorId(proyectoId);
    const perfil = await this.proyectoService.obtenerPerfilPorId(proyectoId, perfilId);

    if (proyecto.finalizado) {
      throw new AppError(ErrorCatalog.COLABORACION_PROYECTO_FINALIZADO, 409, proyectoId);
    }

    // Cupo: si el perfil no tiene cantidadMaxima, no hay límite
    if (perfil.cantidadMaxima !== undefined && perfil.cantidadMaxima !== null) {
      const ocupados = await this.colaboracionRepository.contarActivasPorPerfil(
        proyectoId,
        perfilId,
      );

      if (ocupados >= perfil.cantidadMaxima) {
        throw new AppError(ErrorCatalog.COLABORACION_CUPO_COMPLETO, 409, perfil.descripcion);
      }
    }

    console.log("Perfil obtenido:", perfil);
    console.log("Tipo de perfil:", typeof perfil);
    console.log("ID del perfil:", perfil?._id);
    const colaboracion = new Colaboracion(persona, proyecto, perfil, anonima);
    const colaboracionGuardada = await this.colaboracionRepository.guardar(colaboracion);
    colaboracion.id = colaboracionGuardada.id;

    return colaboracion;
  }

  async obtenerColaboraciones() {
    return await this.colaboracionRepository.obtenerTodas();
  }

  async obtenerColaboracionPorId(id) {
    const colaboracion = await this.colaboracionRepository.obtenerPorId(id);

    if (!colaboracion) {
      throw new AppError(ErrorCatalog.COLABORACION_NO_ENCONTRADA, 404, id);
    }

    return colaboracion;
  }
}
