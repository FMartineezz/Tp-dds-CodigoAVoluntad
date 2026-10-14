import { AppError } from "../errors/appError.js";
import ErrorCatalog from "../errors/errorCatalog.js";
import { Mensaje } from "../models/mensaje.js";
import { TipoMedioDeContacto } from "../models/personaColaboradora.js";

export class MensajeService {
  // transporter: cualquier objeto con sendMail(opciones) (en producción, el de nodemailer)
  constructor({ repository, colectivoService, personaColaboradoraService, transporter }) {
    this.repository = repository;
    this.colectivoService = colectivoService;
    this.personaColaboradoraService = personaColaboradoraService;
    this.transporter = transporter;
  }

  async enviarMensajeDesdeColectivo(colectivoId, personaColaboradoraId, texto) {
    const colectivo = await this.colectivoService.obtenerColectivoPorId(colectivoId);
    const personaColaboradora =
      await this.personaColaboradoraService.obtenerPersonaColaboradoraPorIdConContactos(
        personaColaboradoraId,
      );

    console.log(personaColaboradora);

    if (personaColaboradora.bloquearMensajeInterno) {
      throw new AppError(
        ErrorCatalog.MENSAJE_DESTINATARIA_NO_ACEPTA,
        403,
        personaColaboradora.nombreFantasia,
      );
    }

    const mensaje = new Mensaje(colectivo, personaColaboradora, texto);
    const mensajeGuardado = await this.repository.guardar(mensaje);
    mensaje.id = mensajeGuardado.id;

    this.replicadorDeMensaje(personaColaboradora.contactos, texto);

    return this.vistaDeMensajesEnviados(mensaje);
  }

  async obtenerBandejaDeEntradaColaboradora(personaColaboradoraId) {
    await this.personaColaboradoraService.obtenerPersonaColaboradoraPorId(personaColaboradoraId);

    const mensajes = await this.repository.obtenerPorColaboradoraId(personaColaboradoraId);

    return mensajes.map((mensaje) => this.vistaDeMensajesBandejaEntradas(mensaje));
  }

  //Notificador externo (replicador del mensaje por los contactos de la personaColaboradora)
  async replicadorDeMensaje(contactos, texto) {
    for (const contacto of contactos) {
      switch (contacto.tipo) {
        case TipoMedioDeContacto.EMAIL: {
          this.enviarEmail(contacto.valor, texto);
          break;
        }
        case TipoMedioDeContacto.SMS: {
          this.enviarSms(contacto.valor, texto);
          break;
        }
        case TipoMedioDeContacto.WHATSAPP: {
          this.enviarWhatsapp(contacto.valor, texto);
          break;
        }
      }
    }
  }

  async enviarEmail(email, texto) {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        text: texto,
      });
    } catch {
      console.log("No se pudo enviar el mail al destino");
    }
  }

  async enviarSms(numero, texto) {
    console.log("Se envio el mensaje de texto");
  }

  async enviarWhatsapp(numero, texto) {
    console.log("Se envio el mensaje de wathsapp");
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
