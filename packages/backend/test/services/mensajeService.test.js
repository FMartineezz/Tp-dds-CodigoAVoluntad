import { usarBaseDeDatos } from "../utils/db.js";
import { esperarAppError } from "../utils/esperarAppError.js";
import {
  armarEscenario,
  crearColectivo,
  crearProyecto,
  idInexistente,
} from "../utils/escenarios.js";
import { mensajeService, mailTransporter } from "../../src/container.js";
import ErrorCatalog from "../../src/errors/errorCatalog.js";
import { Emisor } from "../../src/models/mensaje.js";
import { MensajeModel } from "../../src/schemas/mensajeSchema.js";

usarBaseDeDatos();

const enviarDesdeColectivo = (e, texto = "Hola, ¿te interesa colaborar?") =>
  mensajeService.enviarMensaje(e.colectivoId, e.personaId, e.proyectoId, Emisor.COLECTIVO, texto);

const enviarDesdePersona = (e, texto = "¡Sí, me interesa!") =>
  mensajeService.enviarMensaje(e.colectivoId, e.personaId, e.proyectoId, Emisor.PERSONA, texto);

describe("MensajeService", () => {
  describe("envío desde el colectivo", () => {
    test("guarda el mensaje no leído entre el colectivo y la colaboradora", async () => {
      // Preparación
      const e = await armarEscenario();

      // Ejecución
      const mensaje = await enviarDesdeColectivo(e, "Hola");

      // Validación
      const guardado = await MensajeModel.findById(mensaje._id).lean();
      expect(guardado).toMatchObject({ emisor: Emisor.COLECTIVO, texto: "Hola", leido: false });
      expect(guardado.colectivo.toString()).toBe(e.colectivoId);
      expect(guardado.personaColaboradora.toString()).toBe(e.personaId);
      expect(guardado.proyecto.toString()).toBe(e.proyectoId);
      expect(guardado.date).toBeInstanceOf(Date);
    });

    test("no puede escribir sobre un proyecto que no es propio", async () => {
      // Preparación
      const e = await armarEscenario();
      const otroColectivo = await crearColectivo();
      const proyectoAjeno = await crearProyecto({
        colectivo: otroColectivo,
        perfiles: [{ habilidadesRequeridas: [e.habilidad.codigo] }],
      });

      // Ejecución y Validación
      await esperarAppError(
        mensajeService.enviarMensaje(
          e.colectivoId,
          e.personaId,
          proyectoAjeno.id,
          Emisor.COLECTIVO,
          "Hola",
        ),
        ErrorCatalog.MENSAJE_COLECTIVO_NO_COINCIDE_CON_PROYECTO,
        403,
      );
      expect(await MensajeModel.countDocuments()).toBe(0);
    });

    test("no puede escribirle a una colaboradora que bloquea los mensajes internos", async () => {
      const e = await armarEscenario({ bloquearMensajeInterno: true });

      await esperarAppError(
        enviarDesdeColectivo(e),
        ErrorCatalog.MENSAJE_DESTINATARIA_NO_ACEPTA,
        403,
      );
      expect(await MensajeModel.countDocuments()).toBe(0);
    });

    test("falla con 404 si el colectivo, la colaboradora o el proyecto no existen", async () => {
      const e = await armarEscenario();

      await esperarAppError(
        enviarDesdeColectivo({ ...e, colectivoId: idInexistente() }),
        ErrorCatalog.COLECTIVO_NO_ENCONTRADO,
        404,
      );
      await esperarAppError(
        enviarDesdeColectivo({ ...e, personaId: idInexistente() }),
        ErrorCatalog.COLABORADORA_NO_ENCONTRADA,
        404,
      );
      await esperarAppError(
        enviarDesdeColectivo({ ...e, proyectoId: idInexistente() }),
        ErrorCatalog.PROYECTO_NO_ENCONTRADO,
        404,
      );
    });
  });

  describe("respuesta de la colaboradora", () => {
    test("no puede escribir si el colectivo no la contactó antes", async () => {
      const e = await armarEscenario();

      await esperarAppError(
        enviarDesdePersona(e),
        ErrorCatalog.MENSAJE_SIN_CONVERSACION_PREVIA,
        403,
      );
      expect(await MensajeModel.countDocuments()).toBe(0);
    });

    test("puede responder cuando hay una conversación previa sobre el proyecto", async () => {
      // Preparación
      const e = await armarEscenario();
      await enviarDesdeColectivo(e);

      // Ejecución
      const respuesta = await enviarDesdePersona(e, "¡Me sumo!");

      // Validación
      const guardado = await MensajeModel.findById(respuesta._id).lean();
      expect(guardado).toMatchObject({ emisor: Emisor.PERSONA, texto: "¡Me sumo!", leido: false });
    });

    test("una conversación sobre otro proyecto del colectivo no la habilita", async () => {
      // Preparación
      const e = await armarEscenario();
      const otroProyecto = await crearProyecto({
        colectivo: e.colectivo,
        perfiles: [{ habilidadesRequeridas: [e.habilidad.codigo] }],
      });
      await enviarDesdeColectivo({ ...e, proyectoId: otroProyecto.id });

      // Ejecución y Validación
      await esperarAppError(
        enviarDesdePersona(e),
        ErrorCatalog.MENSAJE_SIN_CONVERSACION_PREVIA,
        403,
      );
    });
  });

  describe("listados", () => {
    test("ambos lados ven la conversación completa (enviados y recibidos)", async () => {
      // Preparación
      const e = await armarEscenario();
      const otro = await armarEscenario();
      await enviarDesdeColectivo(e, "Primero");
      await enviarDesdePersona(e, "Segundo");
      await enviarDesdeColectivo(otro, "De otra conversación");

      // Ejecución
      const deLaColaboradora = await mensajeService.verMensajesColaboradora(e.personaId);
      const delColectivo = await mensajeService.verMensajesColectivo(e.colectivoId);

      // Validación
      expect(deLaColaboradora.map((m) => m.texto)).toEqual(["Primero", "Segundo"]);
      expect(delColectivo.map((m) => m.texto)).toEqual(["Primero", "Segundo"]);
      expect(delColectivo[0].proyecto.titulo).toBe(e.proyecto.titulo);
      expect(deLaColaboradora[0].colectivo.nombre).toBe(e.colectivo.nombre);
    });

    test("el listado del colectivo no expone los contactos de la colaboradora", async () => {
      const e = await armarEscenario({ contactos: [{ tipo: "email", valor: "ana@mail.test" }] });
      await enviarDesdeColectivo(e);

      const mensajes = await mensajeService.verMensajesColectivo(e.colectivoId);

      expect(mensajes[0].personaColaboradora.contactos).toBeUndefined();
    });

    test("fallan con 404 si la colaboradora o el colectivo no existen", async () => {
      await esperarAppError(
        mensajeService.verMensajesColaboradora(idInexistente()),
        ErrorCatalog.COLABORADORA_NO_ENCONTRADA,
        404,
      );
      await esperarAppError(
        mensajeService.verMensajesColectivo(idInexistente()),
        ErrorCatalog.COLECTIVO_NO_ENCONTRADO,
        404,
      );
    });
  });

  describe("marcarComoLeidos", () => {
    test("la colaboradora marca como leídos solo los mensajes que le envió el colectivo", async () => {
      // Preparación
      const e = await armarEscenario();
      await enviarDesdeColectivo(e, "Uno");
      await enviarDesdeColectivo(e, "Dos");
      await enviarDesdePersona(e, "Respuesta");

      // Ejecución
      const resultado = await mensajeService.marcarComoLeidos(
        e.colectivoId,
        e.personaId,
        e.proyectoId,
        Emisor.PERSONA,
        true,
      );

      // Validación
      expect(resultado).toEqual({ actualizados: 2 });
      expect(await MensajeModel.countDocuments({ emisor: Emisor.COLECTIVO, leido: true })).toBe(2);
      expect(await MensajeModel.countDocuments({ emisor: Emisor.PERSONA, leido: false })).toBe(1);
    });

    test("el colectivo marca como leídas las respuestas de la colaboradora", async () => {
      const e = await armarEscenario();
      await enviarDesdeColectivo(e);
      await enviarDesdePersona(e);

      const resultado = await mensajeService.marcarComoLeidos(
        e.colectivoId,
        e.personaId,
        e.proyectoId,
        Emisor.COLECTIVO,
        true,
      );

      expect(resultado).toEqual({ actualizados: 1 });
      expect(await MensajeModel.countDocuments({ emisor: Emisor.PERSONA, leido: true })).toBe(1);
    });

    test("volver a marcar no actualiza nada", async () => {
      const e = await armarEscenario();
      await enviarDesdeColectivo(e);
      await mensajeService.marcarComoLeidos(
        e.colectivoId,
        e.personaId,
        e.proyectoId,
        Emisor.PERSONA,
        true,
      );

      const resultado = await mensajeService.marcarComoLeidos(
        e.colectivoId,
        e.personaId,
        e.proyectoId,
        Emisor.PERSONA,
        true,
      );

      expect(resultado).toEqual({ actualizados: 0 });
    });

    test("falla con 404 si el colectivo o la colaboradora no existen", async () => {
      const e = await armarEscenario();

      await esperarAppError(
        mensajeService.marcarComoLeidos(
          idInexistente(),
          e.personaId,
          e.proyectoId,
          "persona",
          true,
        ),
        ErrorCatalog.COLECTIVO_NO_ENCONTRADO,
        404,
      );
      await esperarAppError(
        mensajeService.marcarComoLeidos(
          e.colectivoId,
          idInexistente(),
          e.proyectoId,
          "persona",
          true,
        ),
        ErrorCatalog.COLABORADORA_NO_ENCONTRADA,
        404,
      );
    });
  });

  describe("replicación por medios externos", () => {
    test("enviar a una colaboradora con email, sms y whatsapp no interrumpe el envío interno", async () => {
      // Preparación
      const e = await armarEscenario({
        contactos: [
          { tipo: "email", valor: "ana@mail.test" },
          { tipo: "sms", valor: "1122334455" },
          { tipo: "whatsapp", valor: "1122334455" },
        ],
      });

      // Ejecución
      const mensaje = await enviarDesdeColectivo(e, "Mensaje replicado");

      // Validación
      expect(await MensajeModel.exists({ _id: mensaje._id })).toBeTruthy();
    });

    test("replicadorDeMensaje recorre todos los contactos sin fallar", async () => {
      await expect(
        mensajeService.replicadorDeMensaje(
          [
            { tipo: "email", valor: "ana@mail.test" },
            { tipo: "sms", valor: "1122334455" },
            { tipo: "whatsapp", valor: "1122334455" },
          ],
          "Hola",
        ),
      ).resolves.toBeUndefined();
    });

    test("enviarEmail usa el transporter real y no lanza errores", async () => {
      await expect(mensajeService.enviarEmail("ana@mail.test", "Hola")).resolves.toBeUndefined();
    });

    test("el transporter real (JSON) arma el mail con destinataria y texto", async () => {
      // Ejecución: mismas opciones que arma MensajeService.enviarEmail
      const info = await mailTransporter.sendMail({
        from: process.env.SMTP_USER,
        to: "ana@mail.test",
        text: "Hola desde el colectivo",
      });

      // Validación
      const mail = JSON.parse(info.message);
      expect(mail.to).toEqual([{ address: "ana@mail.test", name: "" }]);
      expect(mail.text).toBe("Hola desde el colectivo");
      expect(info.envelope.to).toEqual(["ana@mail.test"]);
    });
  });
});
