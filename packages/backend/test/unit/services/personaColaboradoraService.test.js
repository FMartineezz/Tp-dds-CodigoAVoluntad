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
      obtenerPodHabilidadId: jest.fn(),
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

  describe("los medios de contacto no se exponen públicamente", () => {
    test("obtenerPersonasColaboradoras oculta los contactos", async () => {
      mockRepo.obtenerTodas.mockResolvedValue([ana]);

      const [persona] = await personaColaboradoraService.obtenerPersonasColaboradoras();

      expect(persona).toEqual({ _id: "pc1", nombreFantasia: "Ana", habilidades: ["h1"] });
    });

    test("obtenerPersonaColaboradoraPorId oculta los contactos", async () => {
      mockRepo.obtenerPorId.mockResolvedValue(ana);

      const persona = await personaColaboradoraService.obtenerPersonaColaboradoraPorId("pc1");

      expect(mockRepo.obtenerPorId).toHaveBeenCalledWith("pc1");
      expect(persona).not.toHaveProperty("contactos");
    });

    test("obtenerPersonasConAlgunaHabilidad filtra por id de habilidad y oculta contactos", async () => {
      mockRepo.obtenerPodHabilidadId.mockResolvedValue([ana]);

      const personas = await personaColaboradoraService.obtenerPersonasConAlgunaHabilidad(["h1"]);

      expect(mockRepo.obtenerPodHabilidadId).toHaveBeenCalledWith(["h1"]);
      expect(personas[0]).not.toHaveProperty("contactos");
    });

    test("internamente se pueden obtener con contactos", async () => {
      mockRepo.obtenerPorId.mockResolvedValue(ana);

      const persona =
        await personaColaboradoraService.obtenerPersonaColaboradoraPorIdConContactos("pc1");

      expect(persona.contactos).toEqual(contactos);
    });

    test("ocultarContactos no modifica el objeto recibido", () => {
      const persona = { ...ana };

      personaColaboradoraService.ocultarContactos(persona);

      expect(persona.contactos).toEqual(contactos);
    });
  });

  test.each([["obtenerPersonaColaboradoraPorId"], ["obtenerPersonaColaboradoraPorIdConContactos"]])(
    "%s falla con 404 si no existe",
    async (metodo) => {
      mockRepo.obtenerPorId.mockResolvedValue(null);

      await esperarAppError(
        personaColaboradoraService[metodo]("inexistente"),
        ErrorCatalog.COLABORADORA_NO_ENCONTRADA,
        404,
      );
    },
  );
});
