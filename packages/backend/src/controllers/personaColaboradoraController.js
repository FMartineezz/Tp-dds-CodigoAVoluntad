export class PersonaColaboradoraController {
  constructor({ personaColaboradoraService, busquedaService }) {
    this.personaColaboradoraService = personaColaboradoraService;
    this.busquedaService = busquedaService;
  }

  crearPersonaColaboradora = (req, res) => {
    const persona = this.personaColaboradoraService.crearPersonaColaboradora(
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

  verPersonasColaboradoras = (req, res) => {
    const personas = this.personaColaboradoraService.verPersonasColaboradoras();

    res.status(200).json(personas);
  };

  verPersonaColaboradoraPorId = (req, res) => {
    const id = Number(req.params.id);

    const persona = this.personaColaboradoraService.verPersonaColaboradoraPorId(id);

    res.status(200).json(persona);
  };

  verProyectosAcordes = (req, res) => {
    const id = Number(req.params.id);

    const proyectos = this.busquedaService.verProyectosAcordesALaPersonaColaboradora(id);

    res.status(200).json(proyectos);
  };
}
