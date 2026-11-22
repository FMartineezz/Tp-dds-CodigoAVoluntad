import { respuestaPaginada } from "../utils/paginacion.js";
/** Endpoints de perfiles de un proyecto, bajo /proyectos/:idProyecto/perfiles (routes/perfilRoutes.js). */
export class PerfilController {
  //Los perfiles tienen sentido unicamente en el contexto del proyecto,
  //Por ende siempre se tomara a proyecto como la entidad principal, y
  //El perfil es una entidad la cual no es a parte sino que viene con el proyecto

  /**
   * @param {object} deps
   * @param {import("../services/proyectoService.js").ProyectoService} deps.proyectoService
   * @param {import("../services/busquedaService.js").BusquedaService} deps.busquedaService
   */
  constructor({ proyectoService, busquedaService }) {
    this.proyectoService = proyectoService;
    this.busquedaService = busquedaService;
  }

  /**
   * GET /proyectos/:idProyecto/perfiles → 200 con los perfiles del proyecto.
   * @param {import("../types.js").RequestConParams} req
   * @param {import("express").Response} res
   */
  obtenerPerfiles = async (req, res) => {
    const proyectoId = req.params.idProyecto;

    const perfiles = await this.proyectoService.obtenerPerfiles(proyectoId);

    res.status(200).json(perfiles);
  };

  /**
   * GET /proyectos/:idProyecto/perfiles/:idPerfil → 200 con el perfil.
   * @param {import("../types.js").RequestConParams} req
   * @param {import("express").Response} res
   */
  obtenerPerfilPorId = async (req, res) => {
    const proyectoId = req.params.idProyecto;
    const perfilId = req.params.idPerfil;

    const perfil = await this.proyectoService.obtenerPerfilPorId(proyectoId, perfilId);

    res.status(200).json(perfil);
  };

  /**
   * POST /proyectos/:idProyecto/perfiles (body validado por validarPerfil) → 201 con el perfil
   * y header Location.
   * @param {import("../types.js").RequestConParams} req
   * @param {import("express").Response} res
   */
  crearPerfil = async (req, res) => {
    const proyectoId = req.params.idProyecto;

    const perfil = await this.proyectoService.agregarPerfil(
      proyectoId,
      req.body.descripcion,
      req.body.habilidadesRequeridas,
      req.body.habilidadesOpcionales,
      req.body.horas,
      req.body.tipoDeCompromiso,
      req.body.modalidadDeColaboracion,
      req.body.cantidadMaxima,
    );

    // 201 + header Location: la URL donde se puede consultar el perfil recién creado
    res.status(201).location(`/proyectos/${proyectoId}/perfiles/${perfil._id}`).json(perfil);
  };

  /**
   * PATCH /proyectos/:idProyecto/perfiles/:idPerfil (body parcial validado) → 200 con el perfil actualizado.
   * @param {import("../types.js").RequestConParams} req
   * @param {import("express").Response} res
   */
  actualizarPerfil = async (req, res) => {
    const { idProyecto, idPerfil } = req.params;

    const perfil = await this.proyectoService.actualizarPerfil(idProyecto, idPerfil, req.body);

    res.status(200).json(perfil);
  };

  /**
   * DELETE /proyectos/:idProyecto/perfiles/:idPerfil → 200 con lo que devuelve el service.
   * @param {import("../types.js").RequestConParams} req
   * @param {import("express").Response} res
   */
  eliminarPerfil = async (req, res) => {
    const { idProyecto, idPerfil } = req.params;

    const perfil = await this.proyectoService.eliminarPerfil(idProyecto, idPerfil);

    res.status(200).json(perfil);
  };

  /**
   * GET /proyectos/:idProyecto/perfiles/:idPerfil/colaboradoras-acordes?pagina&limite → 200 con
   * una RespuestaPaginada de personas colaboradoras que encajan con el perfil.
   * @param {import("../types.js").RequestPaginado} req
   * @param {import("express").Response} res
   */
  obtenerColaboradorasAcordes = async (req, res) => {
    const proyectoId = req.params.idProyecto;
    const perfilId = req.params.idPerfil;

    const pagina = await this.busquedaService.buscarColaboradorasParaPerfil(
      proyectoId,
      perfilId,
      req.paginacion,
    );
    res.status(200).json(respuestaPaginada(pagina, req.paginacion));
  };
}
