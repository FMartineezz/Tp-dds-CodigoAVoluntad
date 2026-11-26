import { respuestaPaginada } from "../utils/paginacion.js";
/** Endpoints de proyectos (routes/proyectoRoutes.js). */
export class ProyectoController {
  /**
   * @param {object} deps
   * @param {import("../services/proyectoService.js").ProyectoService} deps.proyectoService
   */
  constructor({ proyectoService }) {
    this.proyectoService = proyectoService;
  }

  /**
   * POST /proyectos (body validado por proyectoValidation) → 201 con el proyecto y header Location.
   * @param {import("../types.js").RequestConParams} req
   * @param {import("express").Response} res
   */
  crearProyecto = async (req, res) => {
    const proyecto = await this.proyectoService.crearProyecto(
      req.body.titulo,
      req.body.descripcion,
      req.body.perfiles,
      req.body.colectivo,
      req.body.urlSistema,
      req.body.fechaCierre,
      req.body.fechaLimiteBusqueda,
      req.body.urlDonaciones,
    );
    // 201 + header Location: la URL donde se puede consultar el recurso recién creado
    res.status(201).location(`/proyectos/${proyecto._id}`).json(proyecto);
  };

  /**
   * GET /proyectos?pagina&limite&busqueda&estado&modalidad&habilidad → 200 con una
   * RespuestaPaginada de los proyectos que cumplen los filtros (validados en req.filtros).
   * @param {import("../types.js").RequestPaginado & { filtros: object }} req
   * @param {import("express").Response} res
   */
  obtenerProyectos = async (req, res) => {
    const pagina = await this.proyectoService.obtenerProyectos(req.paginacion, req.filtros);

    res.status(200).json(respuestaPaginada(pagina, req.paginacion));
  };

  /**
   * GET /colectivos/:colectivoId/proyectos?pagina&limite → 200 con una RespuestaPaginada de los
   * proyectos del colectivo.
   * @param {import("../types.js").RequestPaginado} req
   * @param {import("express").Response} res
   */
  obtenerProyectosDeColectivo = async (req, res) => {
    const pagina = await this.proyectoService.obtenerProyectosDeColectivo(
      req.params.colectivoId,
      req.paginacion,
    );

    res.status(200).json(respuestaPaginada(pagina, req.paginacion));
  };

  /**
   * GET /proyectos/:id → 200 con el proyecto.
   * @param {import("../types.js").RequestConParams} req
   * @param {import("express").Response} res
   */
  obtenerProyectoPorId = async (req, res) => {
    const id = req.params.id;

    const proyecto = await this.proyectoService.obtenerProyectoPorId(id);

    res.status(200).json(proyecto);
  };

  // Alternativa recurso-céntrica a /finalizar (ver issue REST): PATCH /proyectos/:id { finalizado: true, fechaCierre:22:21:21T url: wwww }
  /**
   * PATCH /proyectos/:id (body validado por validarActualizacionProyecto) → 200 con el proyecto actualizado.
   * @param {import("../types.js").RequestConParams} req
   * @param {import("express").Response} res
   */
  actualizarProyecto = async (req, res) => {
    const id = req.params.id;

    const proyecto = await this.proyectoService.actualizarProyecto(id, req.body);

    res.status(200).json(proyecto);
  };
}
