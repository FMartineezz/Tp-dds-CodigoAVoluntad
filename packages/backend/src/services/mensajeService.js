import { AppError } from "../errors/appError.js";
import ErrorCatalog from "../errors/errorCatalog.js";
import { Mensaje, Emisor } from "../models/mensaje.js";
import { TipoMedioDeContacto } from "../models/personaColaboradora.js";

export class MensajeService {
  // transporter: cualquier objeto con sendMail(opciones) (en producción, el de nodemailer)
  constructor({
    repository,
    colectivoService,
    personaColaboradoraService,
    transporter,
    proyectoService,
  }) {
    this.repository = repository;
    this.colectivoService = colectivoService;
    this.personaColaboradoraService = personaColaboradoraService;
    this.transporter = transporter;
    this.proyectoService = proyectoService;
  }

  async enviarMensaje(colectivoId, personaColaboradoraId, proyectoId, emisor, texto) {
    const colectivo = await this.colectivoService.obtenerColectivoPorId(colectivoId);
    const personaColaboradora =
      await this.personaColaboradoraService.obtenerPersonaColaboradoraPorIdConContactos(
        personaColaboradoraId,
      );
    const proyecto = await this.proyectoService.obtenerProyectoPorId(proyectoId);

    if (emisor === Emisor.COLECTIVO) {
      if (proyecto.colectivo != colectivoId) {
        throw new AppError(ErrorCatalog.MENSAJE_COLECTIVO_NO_COINCIDE_CON_PROYECTO, 403);
      }
      return await this.enviarMensajeDesdeColectivo(
        colectivo,
        personaColaboradora,
        proyecto,
        texto,
      );
    } else {
      return await this.enviarMensajeDesdePersonaColaboradora(
        colectivo,
        personaColaboradora,
        proyecto,
        texto,
      );
    }
  }

  async enviarMensajeDesdeColectivo(colectivo, personaColaboradora, proyecto, texto) {
    if (personaColaboradora.bloquearMensajeInterno) {
      throw new AppError(
        ErrorCatalog.MENSAJE_DESTINATARIA_NO_ACEPTA,
        403,
        personaColaboradora.nombreFantasia,
      );
    }

    const mensaje = new Mensaje(colectivo, personaColaboradora, proyecto, Emisor.COLECTIVO, texto);
    const mensajeGuardado = await this.repository.guardar(mensaje);
    mensaje.id = mensajeGuardado.id;

    this.replicadorDeMensaje(personaColaboradora.contactos, texto);

    return mensajeGuardado;
  }

  async verMensajesColaboradora(personaColaboradoraId) {
    await this.personaColaboradoraService.obtenerPersonaColaboradoraPorId(personaColaboradoraId);

    const mensajes = await this.repository.obtenerPorColaboradoraId(personaColaboradoraId);

    return mensajes;
  }

  async verMensajesColectivo(colectivoId) {
    await this.colectivoService.obtenerColectivoPorId(colectivoId);

    const mensajes = await this.repository.obtenerPorColectivoId(colectivoId);

    return mensajes;
  }

  async enviarMensajeDesdePersonaColaboradora(colectivo, personaColaboradora, proyecto, texto) {
    const existeConversacionPrevia = await this.repository.existeConversacion(
      colectivo._id,
      personaColaboradora._id,
      proyecto._id,
    );

    if (!existeConversacionPrevia) {
      throw new AppError(ErrorCatalog.MENSAJE_SIN_CONVERSACION_PREVIA, 403);
    }

    const mensaje = new Mensaje(colectivo, personaColaboradora, proyecto, Emisor.PERSONA, texto);
    const mensajeGuardado = await this.repository.guardar(mensaje);
    mensaje.id = mensajeGuardado.id;

    return mensajeGuardado;
  }

  async marcarComoLeidos(colectivoId, personaColaboradoraId, proyectoId, lector, leido) {
    await this.colectivoService.obtenerColectivoPorId(colectivoId);
    await this.personaColaboradoraService.obtenerPersonaColaboradoraPorId(personaColaboradoraId);

    const emisorDeLosMensajes = lector === Emisor.PERSONA ? Emisor.COLECTIVO : Emisor.PERSONA;
    const actualizados = await this.repository.marcarComoLeidos(
      colectivoId,
      personaColaboradoraId,
      proyectoId,
      emisorDeLosMensajes,
      leido,
    );
    return { actualizados };
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
}
