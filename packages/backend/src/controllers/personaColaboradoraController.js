import { respuestaPaginada } from "../utils/paginacion.js";
import { TIPOS_DE_FOTO } from "../middlewares/validations/fotoValidation.js";
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
      req.user.id,
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
      req.cuenta,
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
    const contactos = await this.personaColaboradoraService.obtenerContactos(
      req.params.id,
      req.cuenta,
    );

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

    if (String(req.cuenta.id) !== String(req.params.id)) {
      return res.status(403).json({ message: "Acceso denegado" });
    }

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

    await this.personaColaboradoraService.eliminarPersonaColaboradora(id, req.cuenta);

    res.status(204).send();
  };

  // ───── Foto de perfil subida ─────

  /**
   * PUT /colaboradoras/:id/foto (cuerpo: los bytes de la imagen) → 200 con { fotoSubida }.
   * @param {import("../types.js").RequestConParams} req
   * @param {import("express").Response} res
   */
  subirFoto = async (req, res) => {
    // req.is devuelve el tipo sin «; charset…» (ya se validó en recibirFoto)
    const foto = { datos: req.body, tipo: req.is(TIPOS_DE_FOTO) };
    const respuesta = await this.personaColaboradoraService.subirFoto(
      req.params.id,
      foto,
      req.cuenta,
    );
    res.status(200).json(respuesta);
  };

  /**
   * GET /colaboradoras/:id/foto → 200 con la imagen (no JSON).
   * @param {import("../types.js").RequestConParams} req
   * @param {import("express").Response} res
   */
  obtenerFoto = async (req, res) => {
    const foto = await this.personaColaboradoraService.obtenerFoto(req.params.id);
    res.set({
      "Content-Type": foto.tipo,
      // El front pide …/foto?v=<fotoSubida>: si cambia la foto, cambia la URL
      "Cache-Control": "public, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    });
    res.status(200).send(foto.datos);
  };

  /**
   * DELETE /colaboradoras/:id/foto → 204 (sin cuerpo).
   * @param {import("../types.js").RequestConParams} req
   * @param {import("express").Response} res
   */
  borrarFoto = async (req, res) => {
    await this.personaColaboradoraService.borrarFoto(req.params.id, req.cuenta);
    res.status(204).send();
  };
}
