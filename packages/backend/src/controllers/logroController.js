export class LogroController {
  constructor({ logroService }) {
    this.logroService = logroService;
  }

  crearLogro = (req, res) => {
    const proyectoId = Number(req.params.proyectoId);
    const logro = this.logroService.crearLogro(proyectoId, req.body);

    res
      .status(201)
      .location(`/proyectos/${proyectoId}/logros/${logro.id}`)
      .json(logro);
  };

  obtenerLogros = (req, res) => {
    const logros = this.logroService.obtenerLogros(
      Number(req.params.proyectoId),
    );

    res.status(200).json(logros);
  };

  obtenerLogroPorId = (req, res) => {
    const logro = this.logroService.obtenerLogroPorId(
      Number(req.params.proyectoId),
      Number(req.params.logroId),
    );

    res.status(200).json(logro);
  };

  actualizarLogro = (req, res) => {
    const logro = this.logroService.actualizarLogro(
      Number(req.params.proyectoId),
      Number(req.params.logroId),
      req.body,
    );

    res.status(200).json(logro);
  };

  eliminarLogro = (req, res) => {
    const logro = this.logroService.eliminarLogro(
      Number(req.params.proyectoId),
      Number(req.params.logroId),
    );

    res.status(200).json(logro);
  };
}
