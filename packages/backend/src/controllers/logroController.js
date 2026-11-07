export class LogroController {
  constructor({ logroService }) {
    this.logroService = logroService;
  }

  crearLogro = async (req, res) => {
    const proyectoId = req.params.proyectoId;
    const logro = await this.logroService.crearLogro(proyectoId, req.body);

    res.status(201).location(`/proyectos/${proyectoId}/logros/${logro._id}`).json(logro);
  };

  obtenerLogros = async (req, res) => {
    const logros = await this.logroService.obtenerLogros(req.params.proyectoId);

    res.status(200).json(logros);
  };

  obtenerLogroPorId = async (req, res) => {
    const logro = await this.logroService.obtenerLogroPorId(
      req.params.proyectoId,
      req.params.logroId,
    );

    res.status(200).json(logro);
  };

  actualizarLogro = async (req, res) => {
    const logro = await this.logroService.actualizarLogro(
      req.params.proyectoId,
      req.params.logroId,
      req.body,
    );

    res.status(200).json(logro);
  };

  eliminarLogro = async (req, res) => {
    const logro = await this.logroService.eliminarLogro(req.params.proyectoId, req.params.logroId);

    res.status(200).json(logro);
  };
}
