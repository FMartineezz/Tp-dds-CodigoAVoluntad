export class HabilidadController {
  constructor({ habilidadService }) {
    this.habilidadService = habilidadService;
  }

  crearHabilidad = async (req, res) => {
    const respuesta = await this.habilidadService.crearHabilidad(req.body.titulo, req.body.descripcion);
    res.status(201).location(`/habilidades/${respuesta.id}`).json(respuesta);
  };

  obtenerHabilidades = async (req, res) => {
    const respuesta = await this.habilidadService.obtenerHabilidades();
    res.status(200).json(respuesta);
  };

  obtenerHabilidadPorId = async (req, res) => {
    const id = req.params.id;

    const respuesta = await this.habilidadService.obtenerHabilidadPorId(id);
    res.status(200).json(respuesta);
  };
}
