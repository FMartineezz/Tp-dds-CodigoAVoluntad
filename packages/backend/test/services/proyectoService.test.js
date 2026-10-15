import { jest } from "@jest/globals";
import ErrorCatalog from "../../src/errors/errorCatalog.js";
import {
  crearContexto,
  cargarEscenarioBase,
  perfilDeEjemplo,
  expectAppError,
} from "../helpers/crearContexto.js";

describe("ProyectoService", () => {
  let ctx;
  let escenario;

  beforeEach(async () => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    ctx = crearContexto();
    escenario = await cargarEscenarioBase(ctx);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("crearProyecto", () => {
    test("guarda el proyecto abierto, con perfiles, URL del sistema y sin logros", async () => {
      const proyecto = await ctx.proyectoService.obtenerProyectoPorId(escenario.proyecto.id);

      expect(proyecto).toMatchObject({
        titulo: "Web institucional",
        urlSistema: "https://fundacion.org",
        finalizado: false,
        logros: [],
        colectivo: escenario.colectivo.id,
      });
      expect(proyecto.perfiles).toHaveLength(1);
      expect(proyecto.perfiles[0].habilidadesRequeridas).toEqual([escenario.react.id]);
      expect(proyecto.perfiles[0].habilidadesOpcionales).toEqual([escenario.testing.id]);
    });

    test("vincula el proyecto a su colectivo", async () => {
      const colectivo = await ctx.colectivoService.obtenerColectivoPorId(escenario.colectivo.id);

      expect(colectivo.proyectos).toEqual([escenario.proyecto.id]);
    });

    test("no permite dos proyectos con el mismo título en el mismo colectivo", async () => {
      const duplicado = ctx.proyectoService.crearProyecto(
        "Web institucional",
        "otra",
        [perfilDeEjemplo()],
        "Fundación Ejemplo",
        "https://otra.org",
      );

      await expectAppError(duplicado, ErrorCatalog.PROYECTO_YA_EXISTENTE, 409);
      await expect(duplicado).rejects.toThrow(
        "Ya existe un proyecto con titulo Web institucional para el colectivo Fundación Ejemplo",
      );
    });

    test("el mismo título en otro colectivo está permitido", async () => {
      await ctx.colectivoService.crearColectivo("Asamblea Sur", "d", "salta", "asamblea");

      const proyecto = await ctx.proyectoService.crearProyecto(
        "Web institucional",
        "La web de la asamblea",
        [perfilDeEjemplo()],
        "Asamblea Sur",
        "https://asamblea.org",
      );

      expect(proyecto.titulo).toBe("Web institucional");
      expect(await ctx.proyectoService.obtenerProyectos()).toHaveLength(2);
    });

    test("falla si el colectivo no existe", async () => {
      await expectAppError(
        ctx.proyectoService.crearProyecto(
          "Nuevo",
          "d",
          [perfilDeEjemplo()],
          "Nadie",
          "https://x.org",
        ),
        ErrorCatalog.COLECTIVO_NO_ENCONTRADO_POR_NOMBRE,
        400,
      );
    });

    test("falla si un perfil pide una habilidad inexistente", async () => {
      await expectAppError(
        ctx.proyectoService.crearProyecto(
          "Nuevo",
          "d",
          [perfilDeEjemplo({ habilidadesRequeridas: ["cobol"] })],
          "Fundación Ejemplo",
          "https://x.org",
        ),
        ErrorCatalog.HABILIDAD_INEXISTENTE_GENERICO,
        400,
      );
    });
  });

  test("obtenerProyectos lista todos", async () => {
    expect(await ctx.proyectoService.obtenerProyectos()).toHaveLength(1);
  });

  test("obtenerProyectoPorId falla con 404 si no existe", async () => {
    await expectAppError(
      ctx.proyectoService.obtenerProyectoPorId("inexistente"),
      ErrorCatalog.PROYECTO_NO_ENCONTRADO,
      404,
    );
  });

  describe("cierre manual (finalizar)", () => {
    test("marca el proyecto como finalizado y lo devuelve", async () => {
      const proyecto = await ctx.proyectoService.finalizarProyecto(escenario.proyecto.id);

      expect(proyecto).toMatchObject({ titulo: "Web institucional", finalizado: true });
      expect(
        (await ctx.proyectoService.obtenerProyectoPorId(escenario.proyecto.id)).finalizado,
      ).toBe(true);
    });

    test("no se puede finalizar dos veces", async () => {
      await ctx.proyectoService.finalizarProyecto(escenario.proyecto.id);

      await expectAppError(
        ctx.proyectoService.finalizarProyecto(escenario.proyecto.id),
        ErrorCatalog.PROYECTO_FINALIZADO,
        400,
      );
    });

    test("falla con 404 si el proyecto no existe", async () => {
      await expectAppError(
        ctx.proyectoService.finalizarProyecto("inexistente"),
        ErrorCatalog.PROYECTO_NO_ENCONTRADO,
        404,
      );
    });

    test("actualizarProyecto solo acepta { finalizado: true }", async () => {
      await ctx.proyectoService.actualizarProyecto(escenario.proyecto.id, { finalizado: true });

      expect(
        (await ctx.proyectoService.obtenerProyectoPorId(escenario.proyecto.id)).finalizado,
      ).toBe(true);
    });

    test.each([
      [{}],
      [{ finalizado: false }],
      [{ titulo: "Otro" }],
      [{ finalizado: true, titulo: "x" }],
    ])("actualizarProyecto rechaza %j", async (cambios) => {
      await expectAppError(
        ctx.proyectoService.actualizarProyecto(escenario.proyecto.id, cambios),
        ErrorCatalog.ARGUMENTO_INVALIDO,
        400,
      );
    });
  });

  describe("perfiles", () => {
    test("agregarPerfil suma un perfil al proyecto", async () => {
      await ctx.proyectoService.agregarPerfil(
        escenario.proyecto.id,
        "Tester",
        ["testing_e_2_e"],
        ["desarrollo_web_react"],
        3,
        "semanal",
        "incentivo_economico",
      );

      const perfiles = await ctx.proyectoService.obtenerPerfiles(escenario.proyecto.id);
      expect(perfiles.map((p) => p.descripcion)).toEqual(["Desarrollo front", "Tester"]);
    });

    test("obtenerPerfilPorId devuelve el perfil", async () => {
      const [perfil] = await ctx.proyectoService.obtenerPerfiles(escenario.proyecto.id);

      expect(
        await ctx.proyectoService.obtenerPerfilPorId(escenario.proyecto.id, perfil._id),
      ).toMatchObject({ descripcion: "Desarrollo front" });
    });

    test("obtenerPerfilPorId falla con 404 si el perfil no existe", async () => {
      await expectAppError(
        ctx.proyectoService.obtenerPerfilPorId(escenario.proyecto.id, "inexistente"),
        ErrorCatalog.PERFIL_NO_ENCONTRADO,
        404,
      );
    });

    test("obtenerPerfiles falla con 404 si el proyecto no existe", async () => {
      await expectAppError(
        ctx.proyectoService.obtenerPerfiles("inexistente"),
        ErrorCatalog.PROYECTO_NO_ENCONTRADO,
        404,
      );
    });

    describe("actualizarPerfil", () => {
      let perfilId;

      beforeEach(async () => {
        [{ _id: perfilId }] = await ctx.proyectoService.obtenerPerfiles(escenario.proyecto.id);
      });

      test("permite cambios parciales", async () => {
        const perfil = await ctx.proyectoService.actualizarPerfil(escenario.proyecto.id, perfilId, {
          descripcion: "Desarrollo front y diseño",
          horas: 8,
        });

        expect(perfil).toMatchObject({
          descripcion: "Desarrollo front y diseño",
          horas: 8,
          tipoDeCompromiso: "mensual",
          habilidadesRequeridas: [escenario.react.id],
        });
      });

      test("las habilidades se cambian por código y se guardan como id", async () => {
        const perfil = await ctx.proyectoService.actualizarPerfil(escenario.proyecto.id, perfilId, {
          habilidadesRequeridas: ["testing_e_2_e"],
        });

        expect(perfil.habilidadesRequeridas).toEqual([escenario.testing.id]);
        expect(perfil.habilidadesOpcionales).toEqual([escenario.testing.id]);
      });

      test("falla con 400 si una habilidad no existe", async () => {
        await expectAppError(
          ctx.proyectoService.actualizarPerfil(escenario.proyecto.id, perfilId, {
            habilidadesOpcionales: ["cobol"],
          }),
          ErrorCatalog.HABILIDAD_INEXISTENTE_GENERICO,
          400,
        );
      });

      test("falla con 404 si el proyecto no existe", async () => {
        await expectAppError(
          ctx.proyectoService.actualizarPerfil("inexistente", perfilId, { horas: 1 }),
          ErrorCatalog.PROYECTO_NO_ENCONTRADO,
          404,
        );
      });

      test("falla con 404 si el perfil no existe", async () => {
        await expectAppError(
          ctx.proyectoService.actualizarPerfil(escenario.proyecto.id, "inexistente", { horas: 1 }),
          ErrorCatalog.PERFIL_NO_ENCONTRADO,
          404,
        );
      });
    });

    describe("eliminarPerfil", () => {
      test("quita el perfil y lo devuelve", async () => {
        const [perfil] = await ctx.proyectoService.obtenerPerfiles(escenario.proyecto.id);

        const eliminado = await ctx.proyectoService.eliminarPerfil(
          escenario.proyecto.id,
          perfil._id,
        );

        expect(eliminado).toMatchObject({ _id: perfil._id, descripcion: "Desarrollo front" });
        expect(await ctx.proyectoService.obtenerPerfiles(escenario.proyecto.id)).toEqual([]);
      });

      test("falla con 404 si el proyecto no existe", async () => {
        await expectAppError(
          ctx.proyectoService.eliminarPerfil("inexistente", "cualquiera"),
          ErrorCatalog.PROYECTO_NO_ENCONTRADO,
          404,
        );
      });

      test("falla con 404 si el perfil no existe", async () => {
        await expectAppError(
          ctx.proyectoService.eliminarPerfil(escenario.proyecto.id, "inexistente"),
          ErrorCatalog.PERFIL_NO_ENCONTRADO,
          404,
        );
      });
    });
  });

  test("obtenerProyectosConAlgunaHabilidad excluye los proyectos finalizados", async () => {
    expect(
      await ctx.proyectoService.obtenerProyectosConAlgunaHabilidad([escenario.react.id]),
    ).toHaveLength(1);

    await ctx.proyectoService.finalizarProyecto(escenario.proyecto.id);

    expect(
      await ctx.proyectoService.obtenerProyectosConAlgunaHabilidad([escenario.react.id]),
    ).toHaveLength(0);
  });
});
