import { date } from "zod";
import { AppError } from "../errors/appError.js";
import ErrorCatalog from "../errors/errorCatalog.js";
import { Mensaje } from "../models/mensaje.js";

export class MensajeService {
  constructor({ repository, colectivoService, personaColaboradoraService }) {
    this.repository = repository;
    this.colectivoService = colectivoService;
    this.personaColaboradoraService = personaColaboradoraService;
  }

  enviarMensajeDesdeColectivo(colectivoId, personaColaboradoraId, texto) {
    const colectivo = this.colectivoService.obtenerColectivoPorId(colectivoId);
    const personaColaboradora =
      this.personaColaboradoraService.obtenerPersonaColaboradoraPorId(personaColaboradoraId);

    if (personaColaboradora.bloquearMensajeInterno) {
      throw new AppError(
        ErrorCatalog.MENSAJE_DESTINATARIA_NO_ACEPTA,
        403,
        personaColaboradora.nombre,
      );
    }

    const mensaje = new Mensaje(colectivo, personaColaboradora, texto);
    this.repository.agregarMensaje(mensaje);
    return this.vistaDeMensajesEnviados(mensaje);
  }

  obtenerBandejaDeEntradaColaboradora(personaColaboradoraId) {
    this.personaColaboradoraService.obtenerPersonaColaboradoraPorId(personaColaboradoraId);

    const mensajes = this.repository.findByColaboradoraId(personaColaboradoraId);

    return mensajes.map((mensaje) => this.vistaDeMensajesBandejaEntradas(mensaje));
  }

  vistaDeMensajesBandejaEntradas({ id, colectivo, texto, date }) {
    return {
      id: id,
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
