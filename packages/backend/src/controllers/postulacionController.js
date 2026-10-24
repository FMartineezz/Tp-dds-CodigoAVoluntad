export class PostulacionController {
  constructor({ postulacionService }) {
    this.postulacionService = postulacionService;
  }

  crearPostulacion = async (req, res) => {
    const { proyectoId, perfilId } = req.params;

    const postulacion = await this.postulacionService.crearPostulacion(
      proyectoId,
      perfilId,
      req.body.personaColaboradoraId,
      req.body.anonima,
    );

    res.status(201).json(postulacion);
  };

  actualizarPostulacion = async (req, res) => {
    const postulacionId = req.params.postulacionId;

    const postulacion = await this.postulacionService.actualizarEstado(
      postulacionId,
      req.body.estado,
    );

    res.status(200).json(postulacion);
  };

  listarDePersona = async (req, res) => {
    const postulaciones = await this.postulacionService.obtenerDePersona(req.params.id);

    res.status(200).json(postulaciones);
  };

  listarDeColectivo = async (req, res) => {
    const postulaciones = await this.postulacionService.obtenerDeColectivo(
      req.params.colectivoId,
      req.query.estado,
    );

    res.status(200).json(postulaciones);
  };
}
