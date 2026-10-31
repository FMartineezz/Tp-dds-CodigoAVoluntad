import { jest } from "@jest/globals";
import { MensajeService } from "../../../src/services/mensajeService.js";
import { Mensaje } from "../../../src/models/mensaje.js";
import { AppError } from "../../../src/errors/appError.js";
import ErrorCatalog from "../../../src/errors/errorCatalog.js";
import { esperarAppError } from "../../utils/esperarAppError.js";

const colectivo = { _id: "c1", nombre: "Fundación Ejemplo" };

const ana = (cambios = {}) => ({
  _id: "pc1",
  nombreFantasia: "Ana",
  bloquearMensajeInterno: false,
  contactos: [
    { tipo: "email", valor: "ana@mail.com" },
    { tipo: "sms", valor: "1122334455" },
    { tipo: "whatsapp", valor: "1122334455" },
  ],
  ...cambios,
});

describe("MensajeService", () => {
  let mockRepo;
  let mockColectivoService;
  let mockPersonaColaboradoraService;
  let mockTransporter;
  let mensajeService;

  beforeEach(() => {
    // El service loguea a la persona y los envíos simulados de SMS/WhatsApp
    jest.spyOn(console, "log").mockImplementation(() => {});

    mockRepo = { guardar: jest.fn(), obtenerPorColaboradoraId: jest.fn() };
    mockColectivoService = { obtenerColectivoPorId: jest.fn().mockResolvedValue(colectivo) };
    mockPersonaColaboradoraService = {
      obtenerPersonaColaboradoraPorIdConContactos: jest.fn().mockResolvedValue(ana()),
      obtenerPersonaColaboradoraPorId: jest.fn().mockResolvedValue(ana()),
    };
    // Reemplaza al transporter de nodemailer: no se manda ningún mail real
    mockTransporter = { sendMail: jest.fn().mockResolvedValue() };

    mensajeService = new MensajeService({
      repository: mockRepo,
      colectivoService: mockColectivoService,
      personaColaboradoraService: mockPersonaColaboradoraService,
      transporter: mockTransporter,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("enviarMensajeDesdeColectivo", () => {
    test("guarda el mensaje y devuelve la vista del enviado", async () => {
      // Preparación
      mockRepo.guardar.mockResolvedValue({ id: "m1" });

      // Ejecución
      const mensaje = await mensajeService.enviarMensajeDesdeColectivo("c1", "pc1", "Hola Ana");

      // Validación
      expect(mockColectivoService.obtenerColectivoPorId).toHaveBeenCalledWith("c1");
      expect(
        mockPersonaColaboradoraService.obtenerPersonaColaboradoraPorIdConContactos,
      ).toHaveBeenCalledWith("pc1");
      expect(mockRepo.guardar).toHaveBeenCalledWith(expect.any(Mensaje));
      expect(mockRepo.guardar.mock.calls[0][0]).toMatchObject({
        colectivo,
        personaColaboradora: { _id: "pc1" },
        texto: "Hola Ana",
      });
      expect(mensaje).toEqual({
        id: "m1",
        personaColaboradora: "Ana",
        texto: "Hola Ana",
        date: expect.any(Date),
      });
    });

    test("replica la notificación por mail solo a los contactos de tipo email", async () => {
      // Preparación
      mockRepo.guardar.mockResolvedValue({ id: "m1" });

      // Ejecución
      await mensajeService.enviarMensajeDesdeColectivo("c1", "pc1", "Hola Ana");

      // Validación
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ to: "ana@mail.com", text: "Hola Ana" }),
      );
    });

    test("si el envío del mail falla, el mensaje interno se envía igual", async () => {
      // Preparación
      mockRepo.guardar.mockResolvedValue({ id: "m1" });
      mockTransporter.sendMail.mockRejectedValue(new Error("SMTP caído"));

      // Ejecución y validación
      await expect(
        mensajeService.enviarMensajeDesdeColectivo("c1", "pc1", "Hola"),
      ).resolves.toMatchObject({ id: "m1" });
    });

    test("no se puede escribir a quien bloqueó la mensajería interna", async () => {
      // Preparación
      mockPersonaColaboradoraService.obtenerPersonaColaboradoraPorIdConContactos.mockResolvedValue(
        ana({ bloquearMensajeInterno: true }),
      );

      // Ejecución
      const resultado = mensajeService.enviarMensajeDesdeColectivo("c1", "pc1", "Hola");

      // Validación
      await esperarAppError(resultado, ErrorCatalog.MENSAJE_DESTINATARIA_NO_ACEPTA, 403);
      expect(mockRepo.guardar).not.toHaveBeenCalled();
      expect(mockTransporter.sendMail).not.toHaveBeenCalled();
    });

    test("si el colectivo no existe, propaga el 404", async () => {
      mockColectivoService.obtenerColectivoPorId.mockRejectedValue(
        new AppError(ErrorCatalog.COLECTIVO_NO_ENCONTRADO, 404, "c1"),
      );

      await esperarAppError(
        mensajeService.enviarMensajeDesdeColectivo("c1", "pc1", "Hola"),
        ErrorCatalog.COLECTIVO_NO_ENCONTRADO,
        404,
      );
      expect(mockRepo.guardar).not.toHaveBeenCalled();
    });
  });

  describe("obtenerBandejaDeEntradaColaboradora", () => {
    test("devuelve los mensajes recibidos con el nombre del colectivo", async () => {
      // Preparación
      const fecha = new Date("2025-10-01");
      mockRepo.obtenerPorColaboradoraId.mockResolvedValue([
        { _id: "m1", colectivo, personaColaboradora: "pc1", texto: "Hola", date: fecha },
      ]);

      // Ejecución
      const mensajes = await mensajeService.obtenerBandejaDeEntradaColaboradora("pc1");

      // Validación
      expect(mockRepo.obtenerPorColaboradoraId).toHaveBeenCalledWith("pc1");
      expect(mensajes).toEqual([
        { id: "m1", colectivo: "Fundación Ejemplo", texto: "Hola", date: fecha },
      ]);
    });

    test("si la colaboradora no existe, propaga el 404 sin buscar mensajes", async () => {
      mockPersonaColaboradoraService.obtenerPersonaColaboradoraPorId.mockRejectedValue(
        new AppError(ErrorCatalog.COLABORADORA_NO_ENCONTRADA, 404),
      );

      await esperarAppError(
        mensajeService.obtenerBandejaDeEntradaColaboradora("inexistente"),
        ErrorCatalog.COLABORADORA_NO_ENCONTRADA,
        404,
      );
      expect(mockRepo.obtenerPorColaboradoraId).not.toHaveBeenCalled();
    });
  });
});
