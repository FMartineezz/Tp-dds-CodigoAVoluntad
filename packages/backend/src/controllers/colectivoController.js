export class ColectivoController {
  constructor({ service }) {
    this.service = service;
  }

  async crearColectivo(req, res) {
    const respuesta = await this.service.crearColectivo(
      req.body.nombre,
      req.body.descripcion,
      req.body.ubicacion,
      req.body.tipoDeColectivo,
      req.body.proyectos,
    );
    res.status(201).location(`/colectivos/${respuesta.id}`).json(respuesta);
  };

  async obtenerColectivos(req, res) {
    const respuesta = await this.service.obtenerColectivos();
    res.status(200).json(respuesta);
  };

  async obtenerColectivoPorId(req, res) {
    const id = req.params.id;

    const respuesta = await this.service.obtenerColectivoPorId(id);
    res.status(200).json(respuesta);
  };
}
