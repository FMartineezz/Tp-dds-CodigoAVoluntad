import { jest } from "@jest/globals";
import { PersonaColaboradoraService } from "../../../src/services/personaColaboradoraService.js";
import { PersonaColaboradora } from "../../../src/models/personaColaboradora.js";
import { AppError } from "../../../src/errors/appError.js";
import ErrorCatalog from "../../../src/errors/errorCatalog.js";
import { esperarAppError } from "../../utils/esperarAppError.js";

const contactos = [{ tipo: "email", valor: "ana@mail.com" }];
const ana = { _id: "pc1", nombreFantasia: "Ana", habilidades: ["h1"], contactos };

describe("PersonaColaboradoraService", () => {
  let mockRepo;
  let mockHabilidadService;
  let personaColaboradoraService;

  beforeEach(() => {
    mockRepo = {
      guardar: jest.fn(),
      obtenerTodas: jest.fn(),
      obtenerPorId: jest.fn(),
      obtenerPorIdConContactos: jest.fn(),
      obtenerPorHabilidadId: jest.fn(),
      eliminar: jest.fn(),
    };
    mockHabilidadService = { obtenerHabilidadPorCodigo: jest.fn() };
    personaColaboradoraService = new PersonaColaboradoraService({
      personaColaboradoraRepository: mockRepo,
      habilidadService: mockHabilidadService,
    });
  });

  describe("crearPersonaColaboradora", () => {
    test("resuelve los códigos de habilidad, guarda y devuelve el id asignado", async () => {
      // Preparación
      mockHabilidadService.obtenerHabilidadPorCodigo.mockResolvedValue({
        _id: "h1",
        codigo: "react",
      });
      mockRepo.guardar.mockResolvedValue({ id: "pc1" });

      // Ejecución
      const persona = await personaColaboradoraService.crearPersonaColaboradora(
        "Ana",
        "github.com/ana",
        "Ana",
        "García",
        ["react"],
        "ella",
        "Dev front",
        contactos,
        false,
      );

      // Validación
      expect(mockHabilidadService.obtenerHabilidadPorCodigo).toHaveBeenCalledWith("react");
      expect(mockRepo.guardar).toHaveBeenCalledWith(expect.any(PersonaColaboradora));
      expect(persona).toMatchObject({
        id: "pc1",
        nombreFantasia: "Ana",
        habilidades: [{ _id: "h1", codigo: "react" }],
        contactos,
        bloquearMensajeInterno: false,
      });
    });

    test("si alguna habilidad no existe, falla y no guarda nada", async () => {
      // Preparación
      mockHabilidadService.obtenerHabilidadPorCodigo.mockRejectedValue(
        new AppError(ErrorCatalog.HABILIDAD_INEXISTENTE_GENERICO, 400, "cobol"),
      );

      // Ejecución
      const resultado = personaColaboradoraService.crearPersonaColaboradora(
        "Ana",
        "git",
        null,
        null,
        ["cobol"],
      );

      // Validación
      await esperarAppError(resultado, ErrorCatalog.HABILIDAD_INEXISTENTE_GENERICO, 400);
      expect(mockRepo.guardar).not.toHaveBeenCalled();
    });
  });

  // Los contactos se ocultan en la base de datos (el schema los marca con `select: false`),
  // así que el servicio solo decide QUÉ consulta del repositorio usar.
  describe("consultas", () => {
    // Persona tal como la devuelve el repositorio en la vista pública (sin contactos)
    const anaPublica = { _id: "pc1", nombreFantasia: "Ana", habilidades: ["h1"] };

    test("obtenerPersonasColaboradoras devuelve lo que entrega el repositorio", async () => {
      mockRepo.obtenerTodas.mockResolvedValue([anaPublica]);

      const personas = await personaColaboradoraService.obtenerPersonasColaboradoras();

      expect(personas).toEqual([anaPublica]);
    });

    test("obtenerPersonaColaboradoraPorId usa la consulta pública, sin contactos", async () => {
      mockRepo.obtenerPorId.mockResolvedValue(anaPublica);

      const persona = await personaColaboradoraService.obtenerPersonaColaboradoraPorId("pc1");

      expect(mockRepo.obtenerPorId).toHaveBeenCalledWith("pc1");
      expect(mockRepo.obtenerPorIdConContactos).not.toHaveBeenCalled();
      expect(persona).toEqual(anaPublica);
    });

    test("obtenerPersonasConAlgunaHabilidad filtra por id de habilidad", async () => {
      mockRepo.obtenerPorHabilidadId.mockResolvedValue([anaPublica]);

      const personas = await personaColaboradoraService.obtenerPersonasConAlgunaHabilidad(["h1"]);

      expect(mockRepo.obtenerPorHabilidadId).toHaveBeenCalledWith(["h1"]);
      expect(personas).toEqual([anaPublica]);
    });

    test("internamente se pueden obtener con contactos", async () => {
      mockRepo.obtenerPorIdConContactos.mockResolvedValue(ana);

      const persona =
        await personaColaboradoraService.obtenerPersonaColaboradoraPorIdConContactos("pc1");

      expect(mockRepo.obtenerPorIdConContactos).toHaveBeenCalledWith("pc1");
      expect(persona.contactos).toEqual(contactos);
    });
  });

  describe("eliminarPersonaColaboradora", () => {
    test("da de baja a la persona", async () => {
      mockRepo.eliminar.mockResolvedValue({ actualizado: true });

      await personaColaboradoraService.eliminarPersonaColaboradora("pc1");

      expect(mockRepo.eliminar).toHaveBeenCalledWith("pc1");
    });

    test.each([
      ["NO_ENCONTRADO", ErrorCatalog.COLABORADORA_NO_ENCONTRADA, 404],
      ["YA_DADO_DE_BAJA", ErrorCatalog.COLABORADORA_YA_DADA_DE_BAJA, 409],
    ])("si el repositorio informa %s, falla con el error correspondiente", async (razon, error, status) => {
      mockRepo.eliminar.mockResolvedValue({ actualizado: false, razon });

      await esperarAppError(personaColaboradoraService.eliminarPersonaColaboradora("pc1"), error, status);
    });
  });

  test.each([["obtenerPersonaColaboradoraPorId"], ["obtenerPersonaColaboradoraPorIdConContactos"]])(
    "%s falla con 404 si no existe",
    async (metodo) => {
      mockRepo.obtenerPorId.mockResolvedValue(null);
      mockRepo.obtenerPorIdConContactos.mockResolvedValue(null);

      await esperarAppError(
        personaColaboradoraService[metodo]("inexistente"),
        ErrorCatalog.COLABORADORA_NO_ENCONTRADA,
        404,
      );
    },
  );
});
