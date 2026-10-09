export class PersonaColaboradoraController {
  constructor({ personaColaboradoraService, busquedaService }) {
    this.personaColaboradoraService = personaColaboradoraService;
    this.busquedaService = busquedaService;
  }

  crearPersonaColaboradora = async (req, res) => {
    const persona = await this.personaColaboradoraService.crearPersonaColaboradora(
      req.body.nombreFantasia,
      req.body.git,
      req.body.nombre,
      req.body.apellido,
      req.body.habilidades,
      req.body.pronombres,
      req.body.presentacion,
      req.body.contactos,
      req.body.bloquearMensajeInterno,
    );

    res.status(201).location(`/colaboradoras/${persona.id}`).json(persona);
  };

  obtenerPersonasColaboradoras = async (req, res) => {
    const personas = await this.personaColaboradoraService.obtenerPersonasColaboradoras();

    res.status(200).json(personas);
  };

  obtenerPersonaColaboradoraPorId = async (req, res) => {
    const id = req.params.id;

    const persona = await this.personaColaboradoraService.obtenerPersonaColaboradoraPorId(id);

    res.status(200).json(persona);
  };

  obtenerProyectosAcordes = (req, res) => {
    const id = Number(req.params.id);

    const proyectos = this.busquedaService.obtenerProyectosAcordesALaPersonaColaboradora(id);

    res.status(200).json(proyectos);
  };
}
