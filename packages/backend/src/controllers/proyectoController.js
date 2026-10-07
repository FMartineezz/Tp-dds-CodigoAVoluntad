export class ProyectoController {
  constructor({ proyectoService }) {
    this.proyectoService = proyectoService;
  }

  crearProyecto = async (req, res) => {
    const proyecto = await this.proyectoService.crearProyecto(
      req.body.titulo,
      req.body.descripcion,
      req.body.perfiles,
      req.body.colectivo,
    );
    res.status(201).location(`/proyectos/${proyecto.id}`).json(proyecto);
  };

  obtenerProyectos = async (req, res) => {
    const proyectos = await this.proyectoService.obtenerProyectos();

    res.status(200).json(proyectos);
  };

  obtenerProyectoPorId = async (req, res) => {
    const id = Number(req.params.id);

    const proyecto = await this.proyectoService.obtenerProyectoPorId(id);

    res.status(200).json(proyecto);
  };

/*   finalizarProyecto = async (req, res, next) => {
    const id = Number(req.params.id);

    const proyecto = await this.proyectoService.finalizarProyecto(id);

    res.status(200).json(proyecto);
  }; */

  // Alternativa recurso-céntrica a /finalizar (ver issue REST): PATCH /proyectos/:id { finalizado: true }
  actualizarProyecto = async (req, res) => {
    const id = req.params.id;

    const proyecto = await this.proyectoService.actualizarProyecto(id, req.body);

    res.status(200).json(proyecto);
  };
}
