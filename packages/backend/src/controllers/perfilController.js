import proyectoServiceDefault from "../services/proyectoService.js";

class PerfilController {
  //Los perfiles tienen sentido unicamente en el contexto del proyecto,
  //Por ende siempre se tomara a proyecto como la entidad principal, y
  //El perfil es una entidad la cual no es a parte sino que viene con el proyecto

  constructor(proyectoService = proyectoServiceDefault) {
    this.proyectoService = proyectoService;
  }

  obtenerPerfiles = (req, res) => {
    const proyectoId = Number(req.params.idProyecto);

    const perfiles = this.proyectoService.obtenerPerfiles(proyectoId);

    res.status(200).json(perfiles);
  };

  obtenerPerfilesPorId = (req, res) => {
    const proyectoId = Number(req.params.idProyecto);
    const perfilId = Number(req.params.idPerfil);

    const perfil = this.proyectoService.obtenerPerfilPorId(proyectoId, perfilId);

    res.status(200).json(perfil);
  };

  crearPerfil = (req, res) => {
    const proyectoId = Number(req.params.idProyecto);

    const perfil = this.proyectoService.agregarPerfil(
      proyectoId,
      req.body.descripcion,
      req.body.habilidadesRequeridas,
      req.body.habilidadesOpcionales,
      req.body.horas,
      req.body.tipoDeCompromiso,
      req.body.modalidadDeColaboracion,
    );

    res.status(201).json(perfil);
  };

  actualizarPerfil = (req, res) => {
    const proyectoId = Number(req.params.idProyecto);
  };

  eliminarPerfil = (req, res) => {
    const proyectoId = Number(req.params.idProyecto);
  };
}

export default new PerfilController();
