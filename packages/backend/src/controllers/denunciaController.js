/** Endpoints de denuncias: alta desde una colaboración y gestión administrativa (routes/denunciaRoutes.js). */
export class DenunciaController {
  /**
   * @param {object} deps
   * @param {import("../services/denunciaService.js").DenunciaService} deps.denunciaService
   */
  constructor({ denunciaService }) {
    this.denunciaService = denunciaService;
  }

  /**
   * POST /colaboraciones/:id/denuncia (body validado por validarDenuncia) → 201 con la denuncia
   * y header Location a /admin/denuncias/:id.
   * @param {import("../types.js").RequestConParams} req
   * @param {import("express").Response} res
   */
  crearDenuncia = async (req, res) => {
    const colaboracionId = req.params.id;

    const denuncia = await this.denunciaService.crearDenuncia(
      colaboracionId,
      req.body,
    );

    res
      .status(201)
      .location(`/admin/denuncias/${denuncia.id || denuncia._id}`)
      .json(denuncia);
  };

  /**
   * GET /admin/denuncias[?estado&colectivoId] → 200 con las denuncias que cumplen el filtro.
   * @param {import("../types.js").RequestConParams} req
   * @param {import("express").Response} res
   */
  obtenerDenuncias = async (req, res) => {
    const filtro = {};
    if (req.query.estado) filtro.estado = req.query.estado;
    if (req.query.colectivoId) filtro.colectivoId = req.query.colectivoId;

    const denuncias = await this.denunciaService.obtenerDenunciasParaAdmin(filtro);
    res.status(200).json(denuncias);
  };

  /**
   * GET /admin/denuncias/:id → 200 con la denuncia.
   * @param {import("../types.js").RequestConParams} req
   * @param {import("express").Response} res
   */
  obtenerDenunciaPorId = async (req, res) => {
    const id = req.params.id;
    const denuncia = await this.denunciaService.obtenerDenunciaPorIdParaAdmin(id);
    res.status(200).json(denuncia);
  };

  /**
   * PATCH /admin/denuncias/:id/estado (body `{ estado }` validado) → 200 con la denuncia actualizada.
   * @param {import("../types.js").RequestConParams} req
   * @param {import("express").Response} res
   */
  actualizarEstado = async (req, res) => {
    const id = req.params.id;
    const denuncia = await this.denunciaService.actualizarEstadoDenuncia(
      id,
      req.body.estado,
    );
    res.status(200).json(denuncia);
  };
}
