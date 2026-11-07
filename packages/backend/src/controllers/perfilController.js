export class PerfilController {
  //Los perfiles tienen sentido unicamente en el contexto del proyecto,
  //Por ende siempre se tomara a proyecto como la entidad principal, y
  //El perfil es una entidad la cual no es a parte sino que viene con el proyecto

  constructor({ proyectoService, busquedaService }) {
    this.proyectoService = proyectoService;
    this.busquedaService = busquedaService;
  }

  obtenerPerfiles = async (req, res) => {
    const proyectoId = req.params.idProyecto;

    const perfiles = await this.proyectoService.obtenerPerfiles(proyectoId);

    res.status(200).json(perfiles);
  };

  obtenerPerfilPorId = async (req, res) => {
    const proyectoId = req.params.idProyecto;
    const perfilId = req.params.idPerfil;

    const perfil = await this.proyectoService.obtenerPerfilPorId(proyectoId, perfilId);

    res.status(200).json(perfil);
  };

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

    res.status(201).json(perfil);
  };

  actualizarPerfil = async (req, res) => {
    const { idProyecto, idPerfil } = req.params;

    const perfil = await this.proyectoService.actualizarPerfil(idProyecto, idPerfil, req.body);

    res.status(200).json(perfil);
  };

  eliminarPerfil = async (req, res) => {
    const { idProyecto, idPerfil } = req.params;

    const perfil = await this.proyectoService.eliminarPerfil(idProyecto, idPerfil);

    res.status(200).json(perfil);
  };

  obtenerColaboradorasAcordes = async (req, res) => {
    const proyectoId = req.params.idProyecto;
    const perfilId = req.params.idPerfil;

    const personas = await this.busquedaService.obtenerPersonasColaboradorasAcordesAPerfil(
      proyectoId,
      perfilId,
    );
    res.status(200).json(personas);
  };
}
