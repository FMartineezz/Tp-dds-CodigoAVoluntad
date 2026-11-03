export class DenunciaController {
  constructor({ denunciaService }) {
    this.denunciaService = denunciaService;
  }

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

  obtenerDenuncias = async (req, res) => {
    const filtro = {};
    if (req.query.estado) filtro.estado = req.query.estado;
    if (req.query.colectivoId) filtro.colectivoId = req.query.colectivoId;

    const denuncias = await this.denunciaService.obtenerDenunciasParaAdmin(filtro);
    res.status(200).json(denuncias);
  };

  obtenerDenunciaPorId = async (req, res) => {
    const id = req.params.id;
    const denuncia = await this.denunciaService.obtenerDenunciaPorIdParaAdmin(id);
    res.status(200).json(denuncia);
  };

  actualizarEstado = async (req, res) => {
    const id = req.params.id;
    const denuncia = await this.denunciaService.actualizarEstadoDenuncia(
      id,
      req.body.estado,
    );
    res.status(200).json(denuncia);
  };
}
