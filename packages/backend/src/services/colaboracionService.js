import { Colaboracion } from "../models/colaboracion.js";
import { AppError } from "../errors/appError.js";
import ErrorCatalog from "../errors/errorCatalog.js";

export class ColaboracionService {
  constructor({ colaboracionRepository, personaColaboradoraService, proyectoService }) {
    this.colaboracionRepository = colaboracionRepository;
    this.personaColaboradoraService = personaColaboradoraService;
    this.proyectoService = proyectoService;
  }

  async crearColaboracion(personaId, proyectoId, anonima) {
    const persona =
      await this.personaColaboradoraService.obtenerPersonaColaboradoraPorId(personaId);
    const proyecto = await this.proyectoService.obtenerProyectoPorId(proyectoId);

    if (proyecto.finalizado) {
      throw new AppError(ErrorCatalog.COLABORACION_PROYECTO_FINALIZADO, 409, proyectoId);
    }

    const tieneHabilidadRequerida = proyecto.perfiles.some((perfil) =>
      perfil.habilidadesRequeridas.some((habilidadPerfil) =>
        persona.habilidades.some(
          (habilidadPersona) => habilidadPersona.codigo === habilidadPerfil.codigo,
        ),
      ),
    );

    if (!tieneHabilidadRequerida) {
      throw new AppError(
        ErrorCatalog.COLABORACION_HABILIDAD_REQUERIDA,
        400,
        persona.nombreFantasia,
        proyecto.titulo,
        proyecto.colectivo.nombre,
      );
    }

    const colaboracion = new Colaboracion(persona, proyecto, anonima);
    const colaboracionGuardada = await this.colaboracionRepository.guardar(colaboracion);
    colaboracion.id = colaboracionGuardada.id;

    return colaboracion;
  }

  //revisar ocultarSiEsAnonima
  async obtenerColaboraciones() {
    const colaboraciones = await this.colaboracionRepository.obtenerTodas();
    return colaboraciones.map((colaboracion) => this.ocultarSiEsAnonima(colaboracion));
  }

  async obtenerColaboracionPorId(id) {
    const colaboracion = await this.colaboracionRepository.obtenerPorId(id);

    if (!colaboracion) {
      throw new AppError(ErrorCatalog.COLABORACION_NO_ENCONTRADA, 404, id);
    }

    return this.ocultarSiEsAnonima(colaboracion);
  }

  /*   async obtenerColaboraciones() {
    return await this.colaboracionRepository.obtenerTodas();
  } */

  /*   async obtenerColaboracionPorId(id) {
    const colaboracion = await this.colaboracionRepository.obtenerPorId(id);

    if (!colaboracion) {
      throw new AppError(ErrorCatalog.COLABORACION_NO_ENCONTRADA, 404, id);
    }

    return colaboracion;
  } */

  //agregar esto en la query de la db?. para no traer la info y despues mapearla
  ocultarSiEsAnonima(colaboracion) {
    return {
      ...colaboracion,
      personaColaboradora: colaboracion.anonima
        ? null
        : this.personaColaboradoraService.ocultarContactos(colaboracion.personaColaboradora),
    };
  }
}
