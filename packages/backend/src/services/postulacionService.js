import { AppError } from "../errors/appError.js";
import ErrorCatalog from "../errors/errorCatalog.js";
import { EstadoPostulacion, Postulacion } from "../models/postulacion.js";

export class PostulacionService {
  constructor({
    repository,
    personaColaboradoraService,
    proyectoService,
    colectivoService,
    colaboracionService,
  }) {
    this.repository = repository;
    this.personaColaboradoraService = personaColaboradoraService;
    this.proyectoService = proyectoService;
    this.colectivoService = colectivoService;
    this.colaboracionService = colaboracionService;
  }

  async crearPostulacion(proyectoId, perfilId, personaColaboradoraId, anonima = false) {
    const persona =
      await this.personaColaboradoraService.obtenerPersonaColaboradoraPorId(personaColaboradoraId);
    const proyecto = await this.proyectoService.obtenerProyectoPorId(proyectoId);
    const perfil = await this.proyectoService.obtenerPerfilPorId(proyectoId, perfilId);

    //Ya existe la postulacion
    if (
      await this.repository.obtenerPorPersonaProyectoPerfil(
        personaColaboradoraId,
        proyectoId,
        perfilId,
      )
    ) {
      throw new AppError(
        ErrorCatalog.POSTULACION_DUPLICADA,
        409,
        persona.nombreFantasia,
        perfil.descripcion,
      );
    }

    //Proyecto finalizado
    if (proyecto.finalizado) {
      throw new AppError(ErrorCatalog.POSTULACION_PROYECTO_FINALIZADO, 409, proyectoId);
    }
    //Esta cerrada?
    if (!this.proyectoService.estaBusquedaAbierta(proyecto)) {
      throw new AppError(ErrorCatalog.POSTULACION_BUSQUEDA_CERRADA, 409, proyectoId);
    }
    //La persona colaboradora tiene aunque sea 1 habilidad requeridad del perfil al que se quiere postular?
    const esCompatible = perfil.habilidadesRequeridas.some((habilidadPerfil) =>
      persona.habilidades.some(
        (habilidadPersona) => habilidadPersona.toString() === habilidadPerfil.toString(),
      ),
    );

    if (!esCompatible) {
      throw new AppError(ErrorCatalog.POSTULACION_HABILIDAD_REQUERIDA, 400, persona.nombreFantasia);
    }

    const postulacion = new Postulacion(persona, proyecto.colectivo._id, proyecto, perfil, anonima);
    const postulacionGuardada = await this.repository.guardar(postulacion);
    postulacion.id = postulacionGuardada.id;

    return postulacion;
  }

  // VISTAS PÚBLICAS
  async obtenerDePersona(personaColaboradoraId) {
    await this.personaColaboradoraService.obtenerPersonaColaboradoraPorId(personaColaboradoraId);

    const postulaciones = await this.repository.obtenerPorPersona(personaColaboradoraId);

    return postulaciones.map((postulacion) => this.aVistaDePersona(postulacion));
  }

  async obtenerDeColectivo(colectivoId, estado) {
    await this.colectivoService.obtenerColectivoPorId(colectivoId);

    const postulaciones = await this.repository.obtenerPorColectivo(colectivoId, estado);

    return postulaciones.map((postulacion) => this.aVistaDeColectivo(postulacion));
  }

  async #aceptarPostulacion(postulacion) {
    await this.colaboracionService.crearColaboracion(
      postulacion.personaColaboradora.toString(),
      postulacion.proyecto.toString(),
      postulacion.perfil.toString(),
      postulacion.anonima,
    );
    return await this.repository.actualizarPostulacion(postulacion._id, EstadoPostulacion.ACEPTADA);
  }

  async #procesarRechazo(postulacion) {
    return await this.repository.actualizarPostulacion(
      postulacion._id,
      EstadoPostulacion.RECHAZADA,
    );
  }

  async actualizarEstado(postulacionId, nuevoEstado) {
    const postulacion = await this.repository.obtenerPostulacionPorId(postulacionId);

    if (!postulacion) {
      throw new AppError(ErrorCatalog.POSTULACION_NO_ENCONTRADA, 404, postulacionId);
    }

    if (postulacion.estado !== EstadoPostulacion.PENDIENTE) {
      throw new AppError(ErrorCatalog.POSTULACION_YA_RESUELTA, 409);
    }
    if (nuevoEstado === EstadoPostulacion.ACEPTADA) {
      return await this.#aceptarPostulacion(postulacion);
    }

    if (nuevoEstado === EstadoPostulacion.RECHAZADA) {
      return await this.#procesarRechazo(postulacion);
    }
  }

  // ARMADO DE VISTAS
  buscarPerfil(proyecto, perfilId) {
    return proyecto.perfiles.find((perfil) => perfil._id.toString() === perfilId.toString());
  }

  aVistaDePersona({ _id, proyecto, perfil, estado, anonima }) {
    return {
      id: _id,
      proyecto: proyecto.titulo,
      perfil: this.buscarPerfil(proyecto, perfil)?.descripcion,
      estado,
      anonima,
    };
  }

  aVistaDeColectivo({ _id, personaColaboradora, proyecto, perfil, estado }) {
    return {
      id: _id,
      personaColaboradora: {
        id: personaColaboradora._id,
        nombreFantasia: personaColaboradora.nombreFantasia,
        habilidades: personaColaboradora.habilidades,
        presentacion: personaColaboradora.presentacion,
      },
      proyecto: proyecto.titulo,
      perfil: this.buscarPerfil(proyecto, perfil)?.descripcion,
      estado,
    };
  }
}
