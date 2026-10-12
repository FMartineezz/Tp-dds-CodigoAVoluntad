import { AppError } from "../errors/appError.js";
import ErrorCatalog from "../errors/errorCatalog.js";
import { Mensaje } from "../models/mensaje.js";

export class MensajeService {
  constructor({ repository, colectivoService, personaColaboradoraService }) {
    this.repository = repository;
    this.colectivoService = colectivoService;
    this.personaColaboradoraService = personaColaboradoraService;
  }

  async enviarMensajeDesdeColectivo(colectivoId, personaColaboradoraId, texto) {
    const colectivo = await this.colectivoService.obtenerColectivoPorId(colectivoId);
    const personaColaboradora =
      await this.personaColaboradoraService.obtenerPersonaColaboradoraPorId(personaColaboradoraId);

    if (personaColaboradora.bloquearMensajeInterno) {
      throw new AppError(
        ErrorCatalog.MENSAJE_DESTINATARIA_NO_ACEPTA,
        403,
        personaColaboradora.nombre,
      );
    }

    const mensaje = new Mensaje(colectivo, personaColaboradora, texto);
    const mensajeGuardado = await this.repository.guardar(mensaje);
    mensaje.id = mensajeGuardado.id;

    return this.vistaDeMensajesEnviados(mensaje);
  }

  async obtenerBandejaDeEntradaColaboradora(personaColaboradoraId) {
    await this.personaColaboradoraService.obtenerPersonaColaboradoraPorId(personaColaboradoraId);

    const mensajes = await this.repository.obtenerPorColaboradoraId(personaColaboradoraId);

    return mensajes.map((mensaje) => this.vistaDeMensajesBandejaEntradas(mensaje));
  }

  vistaDeMensajesBandejaEntradas({ _id, colectivo, texto, date }) {
    return {
      id: _id,
      colectivo: colectivo.nombre,
      texto: texto,
      date: date,
    };
  }

  vistaDeMensajesEnviados({ id, personaColaboradora, texto, date }) {
    return {
      id: id,
      personaColaboradora: personaColaboradora.nombreFantasia,
      texto: texto,
      date: date,
    };
  }
}
