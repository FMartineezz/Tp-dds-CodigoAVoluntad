import { respuestaPaginada } from "../utils/paginacion.js";
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
      req.body.redesSociales,
    );

    res.status(201).location(`/colaboradoras/${persona.id}`).json(persona);
  };

  actualizarPersonaColaboradora = async (req, res) => {
    const id = req.params.id;

    const persona = await this.personaColaboradoraService.actualizarPersonaColaboradora(
      id,
      req.body,
    );

    res.status(200).json(persona);
  };

  obtenerPersonasColaboradoras = async (req, res) => {
    const pagina = await this.personaColaboradoraService.obtenerPersonasColaboradoras(
      req.paginacion,
    );

    res.status(200).json(respuestaPaginada(pagina, req.paginacion));
  };

  obtenerPersonaColaboradoraPorId = async (req, res) => {
    const id = req.params.id;

    const persona = await this.personaColaboradoraService.obtenerPersonaColaboradoraPorId(id);

    res.status(200).json(persona);
  };

  obtenerProyectosAcordes = async (req, res) => {
    const id = req.params.id;

    const pagina = await this.busquedaService.buscarProyectosParaColaboradora(id, req.paginacion);

    res.status(200).json(respuestaPaginada(pagina, req.paginacion));
  };

  eliminarPersonaColaboradora = async (req, res) => {
    const id = req.params.id;

    await this.personaColaboradoraService.eliminarPersonaColaboradora(id);

    res.status(204).send();
  };
}
