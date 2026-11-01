import { jest } from "@jest/globals";
import { ProyectoService } from "../../../src/services/proyectoService.js";
import { Proyecto } from "../../../src/models/proyecto.js";
import { AppError } from "../../../src/errors/appError.js";
import ErrorCatalog from "../../../src/errors/errorCatalog.js";
import { esperarAppError } from "../../utils/esperarAppError.js";

const colectivo = { _id: "c1", nombre: "Fundación Ejemplo" };

const perfilDeEjemplo = {
  descripcion: "Desarrollo front",
  habilidadesRequeridas: ["react"],
  habilidadesOpcionales: ["cypress"],
  horas: 5,
  tipoDeCompromiso: "mensual",
  modalidadDeColaboracion: "gratuita",
  cantidadMaxima: 2,
};

const proyectoGuardado = (cambios = {}) => ({
  _id: "p1",
  titulo: "Web institucional",
  perfiles: [{ _id: "pf1", descripcion: "Desarrollo front" }],
  finalizado: false,
  ...cambios,
});

describe("ProyectoService", () => {
  let mockRepo;
  let mockPerfilService;
  let mockColectivoService;
  let proyectoService;

  beforeEach(() => {
    mockRepo = {
      guardar: jest.fn(),
      obtenerTodos: jest.fn(),
      obtenerPorId: jest.fn(),
      obtenerPorTituloYColectivo: jest.fn(),
      guardarPerfil: jest.fn(),
      obtenerPerfilPorId: jest.fn(),
      actualizarPerfil: jest.fn(),
      eliminarPerfil: jest.fn(),
      finalizarProyecto: jest.fn(),
      obtenerPorAlgunaHabilidad: jest.fn(),
    };
    mockPerfilService = { crearPerfil: jest.fn(), prepararCambios: jest.fn() };
    mockColectivoService = {
      obtenerColectivoPorNombre: jest.fn(),
      agregarProyecto: jest.fn(),
    };
    proyectoService = new ProyectoService({
      proyectoRepository: mockRepo,
      perfilService: mockPerfilService,
      colectivoService: mockColectivoService,
    });
  });

  describe("crearProyecto", () => {
    const crear = () =>
      proyectoService.crearProyecto(
        "Web institucional",
        "Sitio de la fundación",
        [perfilDeEjemplo],
        "Fundación Ejemplo",
        "https://fundacion.org",
      );

    beforeEach(() => {
      mockColectivoService.obtenerColectivoPorNombre.mockResolvedValue(colectivo);
      mockRepo.obtenerPorTituloYColectivo.mockResolvedValue(null);
      mockPerfilService.crearPerfil.mockResolvedValue({ descripcion: "Desarrollo front" });
      mockRepo.guardar.mockResolvedValue(proyectoGuardado({ id: "p1" }));
    });

    test("guarda el proyecto abierto, con sus perfiles y sin logros", async () => {
      // Ejecución
      const proyecto = await crear();

      // Validación
      expect(mockPerfilService.crearPerfil).toHaveBeenCalledWith(
        "Desarrollo front",
        ["react"],
        ["cypress"],
        5,
        "mensual",
        "gratuita",
        2,
      );
      expect(mockRepo.guardar).toHaveBeenCalledWith(expect.any(Proyecto));
      expect(mockRepo.guardar.mock.calls[0][0]).toMatchObject({
        titulo: "Web institucional",
        perfiles: [{ descripcion: "Desarrollo front" }],
        colectivo,
        urlSistema: "https://fundacion.org",
        logros: [],
        finalizado: false,
      });
      expect(proyecto).toEqual(proyectoGuardado({ id: "p1" }));
    });

    test("busca duplicados por título dentro del mismo colectivo", async () => {
      await crear();

      expect(mockColectivoService.obtenerColectivoPorNombre).toHaveBeenCalledWith(
        "Fundación Ejemplo",
      );
      expect(mockRepo.obtenerPorTituloYColectivo).toHaveBeenCalledWith("Web institucional", "c1");
    });

    test("vincula el proyecto guardado a su colectivo", async () => {
      await crear();

      expect(mockColectivoService.agregarProyecto).toHaveBeenCalledWith("c1", "p1");
    });

    test("no permite dos proyectos con el mismo título en el mismo colectivo", async () => {
      // Preparación
      mockRepo.obtenerPorTituloYColectivo.mockResolvedValue(proyectoGuardado());

      // Ejecución
      const resultado = crear();

      // Validación
      await esperarAppError(resultado, ErrorCatalog.PROYECTO_YA_EXISTENTE, 409);
      await expect(resultado).rejects.toThrow(
        "Ya existe un proyecto con titulo Web institucional para el colectivo Fundación Ejemplo",
      );
      expect(mockRepo.guardar).not.toHaveBeenCalled();
      expect(mockColectivoService.agregarProyecto).not.toHaveBeenCalled();
    });

    test("si el colectivo no existe, falla sin tocar el repositorio", async () => {
      // Preparación
      mockColectivoService.obtenerColectivoPorNombre.mockRejectedValue(
        new AppError(ErrorCatalog.COLECTIVO_NO_ENCONTRADO_POR_NOMBRE, 400, "Fundación Ejemplo"),
      );

      // Ejecución y validación
      await esperarAppError(crear(), ErrorCatalog.COLECTIVO_NO_ENCONTRADO_POR_NOMBRE, 400);
      expect(mockRepo.obtenerPorTituloYColectivo).not.toHaveBeenCalled();
      expect(mockRepo.guardar).not.toHaveBeenCalled();
    });

    test("si un perfil pide una habilidad inexistente, no se guarda", async () => {
      // Preparación
      mockPerfilService.crearPerfil.mockRejectedValue(
        new AppError(ErrorCatalog.HABILIDAD_INEXISTENTE_GENERICO, 400, "cobol"),
      );

      // Ejecución y validación
      await esperarAppError(crear(), ErrorCatalog.HABILIDAD_INEXISTENTE_GENERICO, 400);
      expect(mockRepo.guardar).not.toHaveBeenCalled();
    });
  });

  test("obtenerProyectos devuelve lo que trae el repositorio", async () => {
    mockRepo.obtenerTodos.mockResolvedValue([proyectoGuardado()]);

    expect(await proyectoService.obtenerProyectos()).toEqual([proyectoGuardado()]);
  });

  describe("obtenerProyectoPorId", () => {
    test("devuelve el proyecto", async () => {
      mockRepo.obtenerPorId.mockResolvedValue(proyectoGuardado());

      expect(await proyectoService.obtenerProyectoPorId("p1")).toEqual(proyectoGuardado());
      expect(mockRepo.obtenerPorId).toHaveBeenCalledWith("p1");
    });

    test("falla con 404 si no existe", async () => {
      mockRepo.obtenerPorId.mockResolvedValue(null);

      const resultado = proyectoService.obtenerProyectoPorId("inexistente");

      await esperarAppError(resultado, ErrorCatalog.PROYECTO_NO_ENCONTRADO, 404);
      await expect(resultado).rejects.toThrow("El proyecto inexistente no fue encontrado");
    });
  });

  test("obtenerProyectosConAlgunaHabilidad le delega el filtro al repositorio", async () => {
    // Preparación
    jest.spyOn(console, "log").mockImplementation(() => {});
    mockRepo.obtenerPorAlgunaHabilidad.mockResolvedValue([proyectoGuardado()]);

    // Ejecución
    const proyectos = await proyectoService.obtenerProyectosConAlgunaHabilidad(["h1", "h2"]);

    // Validación
    expect(mockRepo.obtenerPorAlgunaHabilidad).toHaveBeenCalledWith(["h1", "h2"]);
    expect(proyectos).toHaveLength(1);
    console.log.mockRestore();
  });

  describe("finalizarProyecto", () => {
    test("marca el proyecto como finalizado", async () => {
      // Preparación
      mockRepo.obtenerPorId.mockResolvedValue(proyectoGuardado());
      mockRepo.finalizarProyecto.mockResolvedValue(proyectoGuardado({ finalizado: true }));

      // Ejecución
      const proyecto = await proyectoService.finalizarProyecto("p1");

      // Validación
      expect(mockRepo.finalizarProyecto).toHaveBeenCalledWith("p1");
      expect(proyecto.finalizado).toBe(true);
    });

    test("no se puede finalizar dos veces", async () => {
      mockRepo.obtenerPorId.mockResolvedValue(proyectoGuardado({ finalizado: true }));

      await esperarAppError(
        proyectoService.finalizarProyecto("p1"),
        ErrorCatalog.PROYECTO_FINALIZADO,
        400,
      );
      expect(mockRepo.finalizarProyecto).not.toHaveBeenCalled();
    });

    test("falla con 404 si el proyecto no existe", async () => {
      mockRepo.obtenerPorId.mockResolvedValue(null);

      await esperarAppError(
        proyectoService.finalizarProyecto("inexistente"),
        ErrorCatalog.PROYECTO_NO_ENCONTRADO,
        404,
      );
    });
  });

  describe("actualizarProyecto", () => {
    test("{ finalizado: true } finaliza el proyecto", async () => {
      mockRepo.obtenerPorId.mockResolvedValue(proyectoGuardado());
      mockRepo.finalizarProyecto.mockResolvedValue(proyectoGuardado({ finalizado: true }));

      await proyectoService.actualizarProyecto("p1", { finalizado: true });

      expect(mockRepo.finalizarProyecto).toHaveBeenCalledWith("p1");
    });

    test.each([
      [undefined],
      [{}],
      [{ finalizado: false }],
      [{ titulo: "Otro" }],
      [{ finalizado: true, titulo: "x" }],
    ])("rechaza %j con 400 sin consultar el repositorio", async (cambios) => {
      await esperarAppError(
        proyectoService.actualizarProyecto("p1", cambios),
        ErrorCatalog.ARGUMENTO_INVALIDO,
        400,
      );
      expect(mockRepo.obtenerPorId).not.toHaveBeenCalled();
    });
  });

  describe("perfiles", () => {
    test("agregarPerfil crea el perfil y lo guarda en el proyecto", async () => {
      // Preparación
      const perfilCreado = { descripcion: "Tester" };
      mockPerfilService.crearPerfil.mockResolvedValue(perfilCreado);
      mockRepo.guardarPerfil.mockResolvedValue({ _id: "pf2", ...perfilCreado });

      // Ejecución
      const perfil = await proyectoService.agregarPerfil(
        "p1",
        "Tester",
        ["cypress"],
        [],
        3,
        "semanal",
        "incentivo_economico",
        4,
      );

      // Validación
      expect(mockPerfilService.crearPerfil).toHaveBeenCalledWith(
        "Tester",
        ["cypress"],
        [],
        3,
        "semanal",
        "incentivo_economico",
        4,
      );
      expect(mockRepo.guardarPerfil).toHaveBeenCalledWith("p1", perfilCreado);
      expect(perfil).toEqual({ _id: "pf2", descripcion: "Tester" });
    });

    test("obtenerPerfiles devuelve los perfiles del proyecto", async () => {
      mockRepo.obtenerPorId.mockResolvedValue(proyectoGuardado());

      expect(await proyectoService.obtenerPerfiles("p1")).toEqual(proyectoGuardado().perfiles);
    });

    test("obtenerPerfiles falla con 404 si el proyecto no existe", async () => {
      mockRepo.obtenerPorId.mockResolvedValue(null);

      await esperarAppError(
        proyectoService.obtenerPerfiles("inexistente"),
        ErrorCatalog.PROYECTO_NO_ENCONTRADO,
        404,
      );
    });

    describe("obtenerPerfilPorId", () => {
      test("devuelve el perfil", async () => {
        mockRepo.obtenerPorId.mockResolvedValue(proyectoGuardado());
        mockRepo.obtenerPerfilPorId.mockResolvedValue({ _id: "pf1" });

        expect(await proyectoService.obtenerPerfilPorId("p1", "pf1")).toEqual({ _id: "pf1" });
        expect(mockRepo.obtenerPerfilPorId).toHaveBeenCalledWith("p1", "pf1");
      });

      test("falla con 404 si el perfil no existe", async () => {
        mockRepo.obtenerPorId.mockResolvedValue(proyectoGuardado());
        mockRepo.obtenerPerfilPorId.mockResolvedValue(null);

        await esperarAppError(
          proyectoService.obtenerPerfilPorId("p1", "inexistente"),
          ErrorCatalog.PERFIL_NO_ENCONTRADO,
          404,
        );
      });

      test("falla con 404 si el proyecto no existe, sin buscar el perfil", async () => {
        mockRepo.obtenerPorId.mockResolvedValue(null);

        await esperarAppError(
          proyectoService.obtenerPerfilPorId("inexistente", "pf1"),
          ErrorCatalog.PROYECTO_NO_ENCONTRADO,
          404,
        );
        expect(mockRepo.obtenerPerfilPorId).not.toHaveBeenCalled();
      });
    });

    describe("actualizarPerfil", () => {
      test("prepara los cambios y se los pasa al repositorio", async () => {
        // Preparación
        const cambios = { habilidadesRequeridas: ["react"], horas: 8 };
        const cambiosPreparados = { habilidadesRequeridas: [{ _id: "h1" }], horas: 8 };
        mockRepo.obtenerPorId.mockResolvedValue(proyectoGuardado());
        mockRepo.obtenerPerfilPorId.mockResolvedValue({ _id: "pf1" });
        mockPerfilService.prepararCambios.mockResolvedValue(cambiosPreparados);
        mockRepo.actualizarPerfil.mockResolvedValue({ _id: "pf1", horas: 8 });

        // Ejecución
        const perfil = await proyectoService.actualizarPerfil("p1", "pf1", cambios);

        // Validación
        expect(mockPerfilService.prepararCambios).toHaveBeenCalledWith(cambios);
        expect(mockRepo.actualizarPerfil).toHaveBeenCalledWith("p1", "pf1", cambiosPreparados);
        expect(perfil).toEqual({ _id: "pf1", horas: 8 });
      });

      test("falla con 404 si el perfil no existe, sin preparar cambios", async () => {
        mockRepo.obtenerPorId.mockResolvedValue(proyectoGuardado());
        mockRepo.obtenerPerfilPorId.mockResolvedValue(null);

        await esperarAppError(
          proyectoService.actualizarPerfil("p1", "inexistente", { horas: 1 }),
          ErrorCatalog.PERFIL_NO_ENCONTRADO,
          404,
        );
        expect(mockPerfilService.prepararCambios).not.toHaveBeenCalled();
        expect(mockRepo.actualizarPerfil).not.toHaveBeenCalled();
      });
    });

    describe("eliminarPerfil", () => {
      test("le pide al repositorio que lo quite", async () => {
        mockRepo.obtenerPorId.mockResolvedValue(proyectoGuardado());
        mockRepo.obtenerPerfilPorId.mockResolvedValue({ _id: "pf1" });
        mockRepo.eliminarPerfil.mockResolvedValue({ _id: "pf1" });

        expect(await proyectoService.eliminarPerfil("p1", "pf1")).toEqual({ _id: "pf1" });
        expect(mockRepo.eliminarPerfil).toHaveBeenCalledWith("p1", "pf1");
      });

      test("falla con 404 si el perfil no existe", async () => {
        mockRepo.obtenerPorId.mockResolvedValue(proyectoGuardado());
        mockRepo.obtenerPerfilPorId.mockResolvedValue(null);

        await esperarAppError(
          proyectoService.eliminarPerfil("p1", "inexistente"),
          ErrorCatalog.PERFIL_NO_ENCONTRADO,
          404,
        );
        expect(mockRepo.eliminarPerfil).not.toHaveBeenCalled();
      });
    });
  });
});
