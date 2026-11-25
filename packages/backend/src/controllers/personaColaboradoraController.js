import { respuestaPaginada } from "../utils/paginacion.js";
/** Endpoints de personas colaboradoras, bajo /colaboradoras (routes/personaColaboradoraRoutes.js). */
export class PersonaColaboradoraController {
  /**
   * @param {object} deps
   * @param {import("../services/personaColaboradoraService.js").PersonaColaboradoraService} deps.personaColaboradoraService
   * @param {import("../services/busquedaService.js").BusquedaService} deps.busquedaService
   */
  constructor({ personaColaboradoraService, busquedaService }) {
    this.personaColaboradoraService = personaColaboradoraService;
    this.busquedaService = busquedaService;
  }

  /**
   * POST /colaboradoras (body validado por validarColaboradora) → 201 con la persona y header Location.
   * @param {import("../types.js").RequestConParams} req
   * @param {import("express").Response} res
   */
  crearPersonaColaboradora = async (req, res) => {
    const persona = await this.personaColaboradoraService.crearPersonaColaboradora(
      req.body.nombreFantasia,
      req.body.git,
      req.body.nombre,
      req.body.apellido,
      req.body.habilidades,
      req.body.pronombres,
      req.body.presentacion,
      req.body.contactos,
      req.body.bloquearMensajeInterno,
      req.body.redesSociales,
      req.body.foto,
      req.body.sitioWeb,
    );

    res.status(201).location(`/colaboradoras/${persona.id}`).json(persona);
  };

  /**
   * PATCH /colaboradoras/:id (body parcial validado) → 200 con la persona actualizada.
   * @param {import("../types.js").RequestConParams} req
   * @param {import("express").Response} res
   */
  actualizarPersonaColaboradora = async (req, res) => {
    const id = req.params.id;

    const persona = await this.personaColaboradoraService.actualizarPersonaColaboradora(
      id,
      req.body,
    );

    res.status(200).json(persona);
  };

  /**
   * GET /colaboradoras?pagina&limite&busqueda&habilidad&aceptaMensajes → 200 con una
   * RespuestaPaginada de las personas que cumplen los filtros (validados en req.filtros).
   * @param {import("../types.js").RequestPaginado & { filtros: object }} req
   * @param {import("express").Response} res
   */
  obtenerPersonasColaboradoras = async (req, res) => {
    const pagina = await this.personaColaboradoraService.obtenerPersonasColaboradoras(
      req.paginacion,
      req.filtros,
    );

    res.status(200).json(respuestaPaginada(pagina, req.paginacion));
  };

  /**
   * GET /colaboradoras/:id → 200 con la persona.
   * @param {import("../types.js").RequestConParams} req
   * @param {import("express").Response} res
   */
  obtenerPersonaColaboradoraPorId = async (req, res) => {
    const id = req.params.id;

    const persona = await this.personaColaboradoraService.obtenerPersonaColaboradoraPorId(id);

    res.status(200).json(persona);
  };

  /**
   * GET /colaboradoras/:id/contactos?colaboradoraId | ?colectivoId → 200 con la lista de
   * contactos, o 403 si quien pide no tiene acceso.
   * PENDIENTE (login): quién pide viaja por query porque todavía no hay sesión. Cuando se
   * integre feature/login, sale del token (req.user) y se sacan estos parámetros.
   * @param {import("../types.js").RequestConParams} req
   * @param {import("express").Response} res
   */
  obtenerContactos = async (req, res) => {
    const contactos = await this.personaColaboradoraService.obtenerContactos(req.params.id, {
      colaboradoraId: req.query.colaboradoraId,
      colectivoId: req.query.colectivoId,
    });

    res.status(200).json(contactos);
  };

  /**
   * GET /colaboradoras/:id/proyectos-acordes?pagina&limite → 200 con una RespuestaPaginada de
   * proyectos que encajan con la persona.
   * @param {import("../types.js").RequestPaginado} req
   * @param {import("express").Response} res
   */
  obtenerProyectosAcordes = async (req, res) => {
    const id = req.params.id;

    const pagina = await this.busquedaService.buscarProyectosParaColaboradora(id, req.paginacion);

    res.status(200).json(respuestaPaginada(pagina, req.paginacion));
  };

  /**
   * DELETE /colaboradoras/:id → 204 (sin cuerpo).
   * @param {import("../types.js").RequestConParams} req
   * @param {import("express").Response} res
   */
  eliminarPersonaColaboradora = async (req, res) => {
    const id = req.params.id;

    await this.personaColaboradoraService.eliminarPersonaColaboradora(id);

    res.status(204).send();
  };
}
