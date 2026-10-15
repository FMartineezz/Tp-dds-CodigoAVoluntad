import { jest } from "@jest/globals";
import ErrorCatalog from "../../src/errors/errorCatalog.js";
import { FakeTransporter } from "../fakes/fakeRepositories.js";
import { crearContexto, expectAppError } from "../helpers/crearContexto.js";

describe("MensajeService", () => {
  let ctx;
  let colectivo;
  let ana;

  const prepararContexto = async (opciones) => {
    ctx = crearContexto(opciones);
    await ctx.habilidadService.crearHabilidad("Python", "d");
    colectivo = await ctx.colectivoService.crearColectivo("Fundación", "d", "caba", "fundacion");
    ana = await ctx.personaColaboradoraService.crearPersonaColaboradora(
      "Ana",
      "github.com/ana",
      null,
      null,
      ["python"],
      null,
      "Hola",
      [
        { tipo: "email", valor: "ana@mail.com" },
        { tipo: "sms", valor: "1127891234" },
        { tipo: "whatsapp", valor: "1127891234" },
      ],
    );
  };

  beforeEach(async () => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    await prepararContexto();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("enviarMensajeDesdeColectivo", () => {
    test("guarda el mensaje y devuelve la vista del enviado", async () => {
      const enviado = await ctx.mensajeService.enviarMensajeDesdeColectivo(
        colectivo.id,
        ana.id,
        "¡Hola Ana!",
      );

      expect(enviado).toEqual({
        id: expect.any(String),
        personaColaboradora: "Ana",
        texto: "¡Hola Ana!",
        date: expect.any(Date),
      });
    });

    test("replica la notificación por email a los contactos registrados", async () => {
      await ctx.mensajeService.enviarMensajeDesdeColectivo(colectivo.id, ana.id, "¡Hola Ana!");

      expect(ctx.transporter.enviados).toEqual([
        expect.objectContaining({ to: "ana@mail.com", text: "¡Hola Ana!" }),
      ]);
    });

    test("si el envío del mail falla, el mensaje interno se envía igual", async () => {
      await prepararContexto({ transporter: new FakeTransporter({ falla: true }) });

      const enviado = await ctx.mensajeService.enviarMensajeDesdeColectivo(
        colectivo.id,
        ana.id,
        "Hola",
      );

      expect(enviado.texto).toBe("Hola");
    });

    test("no se puede escribir a quien bloqueó la mensajería interna", async () => {
      const beto = await ctx.personaColaboradoraService.crearPersonaColaboradora(
        "Beto",
        "g",
        null,
        null,
        ["python"],
        null,
        null,
        [],
        true,
      );

      const envio = ctx.mensajeService.enviarMensajeDesdeColectivo(colectivo.id, beto.id, "Hola");

      await expectAppError(envio, ErrorCatalog.MENSAJE_DESTINATARIA_NO_ACEPTA, 403);
      await expect(envio).rejects.toThrow("La colaboradora Beto no acepta mensajes internos");
      expect(ctx.transporter.enviados).toEqual([]);
    });

    test("falla con 404 si el colectivo no existe", async () => {
      await expectAppError(
        ctx.mensajeService.enviarMensajeDesdeColectivo("inexistente", ana.id, "Hola"),
        ErrorCatalog.COLECTIVO_NO_ENCONTRADO,
        404,
      );
    });

    test("falla con 404 si la colaboradora no existe", async () => {
      await expectAppError(
        ctx.mensajeService.enviarMensajeDesdeColectivo(colectivo.id, "inexistente", "Hola"),
        ErrorCatalog.COLABORADORA_NO_ENCONTRADA,
        404,
      );
    });
  });

  describe("obtenerBandejaDeEntradaColaboradora", () => {
    test("devuelve los mensajes recibidos con el nombre del colectivo", async () => {
      await ctx.mensajeService.enviarMensajeDesdeColectivo(colectivo.id, ana.id, "Primero");
      await ctx.mensajeService.enviarMensajeDesdeColectivo(colectivo.id, ana.id, "Segundo");

      const bandeja = await ctx.mensajeService.obtenerBandejaDeEntradaColaboradora(ana.id);

      expect(bandeja).toEqual([
        {
          id: expect.any(String),
          colectivo: "Fundación",
          texto: "Primero",
          date: expect.any(Date),
        },
        {
          id: expect.any(String),
          colectivo: "Fundación",
          texto: "Segundo",
          date: expect.any(Date),
        },
      ]);
    });

    test("falla con 404 si la colaboradora no existe", async () => {
      await expectAppError(
        ctx.mensajeService.obtenerBandejaDeEntradaColaboradora("inexistente"),
        ErrorCatalog.COLABORADORA_NO_ENCONTRADA,
        404,
      );
    });
  });
});
