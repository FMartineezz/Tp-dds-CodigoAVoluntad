import ErrorCatalog from "../../src/errors/errorCatalog.js";
import { TipoRedSocial } from "../../src/models/redSocial.js";
import { crearContexto, expectAppError } from "../helpers/crearContexto.js";

describe("ColectivoService", () => {
  let ctx;

  beforeEach(() => {
    ctx = crearContexto();
  });

  test("crearColectivo guarda el colectivo sin proyectos y devuelve su id", async () => {
    const colectivo = await ctx.colectivoService.crearColectivo(
      "Fundación",
      "d",
      "caba",
      "fundacion",
    );

    expect(colectivo).toMatchObject({ nombre: "Fundación", proyectos: [] });
    expect(await ctx.colectivoService.obtenerColectivoPorId(colectivo.id)).toMatchObject({
      nombre: "Fundación",
    });
  });

  test("crearColectivo guarda el colectivo con proyectos y redes sociales explícitos", async () => {
    const redes = [{ tipo: TipoRedSocial.INSTAGRAM, url: "https://instagram.com/eco" }];
    const colectivo = await ctx.colectivoService.crearColectivo(
      "Fundación Verde",
      "d",
      "caba",
      "fundacion",
      ["proyecto-1", "proyecto-2"],
      redes,
    );

    expect(colectivo.proyectos).toEqual(["proyecto-1", "proyecto-2"]);
    expect(colectivo.redesSociales).toHaveLength(1);
    expect(colectivo.redesSociales[0].tipo).toBe("instagram");

    const persistido = await ctx.colectivoService.obtenerColectivoPorId(colectivo.id);
    expect(persistido.proyectos).toEqual(["proyecto-1", "proyecto-2"]);
    expect(persistido.redesSociales).toHaveLength(1);
  });

  test("no permite dos colectivos con el mismo nombre", async () => {
    await ctx.colectivoService.crearColectivo("Fundación", "d", "caba", "fundacion");

    await expectAppError(
      ctx.colectivoService.crearColectivo("Fundación", "otra", "salta", "ong"),
      ErrorCatalog.COLECTIVO_YA_EXISTE,
      409,
    );
  });

  test("obtenerColectivos lista todos", async () => {
    await ctx.colectivoService.crearColectivo("A", "d", "caba", "ong");
    await ctx.colectivoService.crearColectivo("B", "d", "caba", "ong");

    expect(await ctx.colectivoService.obtenerColectivos()).toHaveLength(2);
  });

  test("obtenerColectivoPorId falla con 404 si no existe", async () => {
    await expectAppError(
      ctx.colectivoService.obtenerColectivoPorId("inexistente"),
      ErrorCatalog.COLECTIVO_NO_ENCONTRADO,
      404,
    );
  });

  test("obtenerColectivoPorNombre falla con 400 si no existe", async () => {
    await expectAppError(
      ctx.colectivoService.obtenerColectivoPorNombre("Nadie"),
      ErrorCatalog.COLECTIVO_NO_ENCONTRADO_POR_NOMBRE,
      400,
    );
  });

  test("agregarProyecto vincula el proyecto al colectivo", async () => {
    const colectivo = await ctx.colectivoService.crearColectivo("A", "d", "caba", "ong");

    await ctx.colectivoService.agregarProyecto(colectivo.id, "proyecto-1");

    expect((await ctx.colectivoService.obtenerColectivoPorId(colectivo.id)).proyectos).toEqual([
      "proyecto-1",
    ]);
  });

  describe("redes sociales", () => {
    test("crear un perfil sin redes sociales", async () => {
      const colectivo = await ctx.colectivoService.crearColectivo(
        "Eco",
        "d",
        "caba",
        "ong",
        [],
        [],
      );

      expect(colectivo.redesSociales).toEqual([]);
      const recuperado = await ctx.colectivoService.obtenerColectivoPorId(colectivo.id);
      expect(recuperado.redesSociales).toEqual([]);
    });

    test("crear un perfil con varias redes sociales", async () => {
      const redes = [
        { tipo: TipoRedSocial.INSTAGRAM, url: "https://instagram.com/eco" },
        { tipo: TipoRedSocial.LINKEDIN, url: "https://linkedin.com/company/eco" },
      ];
      const colectivo = await ctx.colectivoService.crearColectivo(
        "Eco",
        "d",
        "caba",
        "ong",
        [],
        redes,
      );

      expect(colectivo.redesSociales).toHaveLength(2);
      expect(colectivo.redesSociales[0].tipo).toBe("instagram");
      expect(colectivo.redesSociales[1].tipo).toBe("linkedin");
    });

    test("actualizar las redes sociales existentes", async () => {
      const iniciales = [
        { tipo: TipoRedSocial.INSTAGRAM, url: "https://instagram.com/eco" },
        { tipo: TipoRedSocial.LINKEDIN, url: "https://linkedin.com/company/eco" },
      ];
      const colectivo = await ctx.colectivoService.crearColectivo(
        "Eco",
        "d",
        "caba",
        "ong",
        [],
        iniciales,
      );

      await ctx.colectivoService.actualizarColectivo(colectivo.id, {
        redesSociales: [
          { tipo: TipoRedSocial.INSTAGRAM, url: "https://instagram.com/eco_oficial" },
          { tipo: TipoRedSocial.LINKEDIN, url: "https://linkedin.com/company/eco" },
        ],
      });

      const actualizado = await ctx.colectivoService.obtenerColectivoPorId(colectivo.id);
      expect(actualizado.redesSociales).toHaveLength(2);
      expect(actualizado.redesSociales[0].url).toBe("https://instagram.com/eco_oficial");
    });

    test("agregar una red nueva", async () => {
      const iniciales = [{ tipo: TipoRedSocial.INSTAGRAM, url: "https://instagram.com/eco" }];
      const colectivo = await ctx.colectivoService.crearColectivo(
        "Eco",
        "d",
        "caba",
        "ong",
        [],
        iniciales,
      );

      await ctx.colectivoService.actualizarColectivo(colectivo.id, {
        redesSociales: [
          { tipo: TipoRedSocial.INSTAGRAM, url: "https://instagram.com/eco" },
          { tipo: TipoRedSocial.YOUTUBE, url: "https://youtube.com/@eco" },
        ],
      });

      const actualizado = await ctx.colectivoService.obtenerColectivoPorId(colectivo.id);
      expect(actualizado.redesSociales).toHaveLength(2);
      expect(actualizado.redesSociales.map((r) => r.tipo)).toEqual(["instagram", "youtube"]);
    });

    test("reemplazar la URL de una red existente", async () => {
      const iniciales = [{ tipo: TipoRedSocial.GITHUB, url: "https://github.com/eco-old" }];
      const colectivo = await ctx.colectivoService.crearColectivo(
        "Eco",
        "d",
        "caba",
        "ong",
        [],
        iniciales,
      );

      await ctx.colectivoService.actualizarColectivo(colectivo.id, {
        redesSociales: [{ tipo: TipoRedSocial.GITHUB, url: "https://github.com/eco-new" }],
      });

      const actualizado = await ctx.colectivoService.obtenerColectivoPorId(colectivo.id);
      expect(actualizado.redesSociales).toEqual([
        expect.objectContaining({ tipo: "github", url: "https://github.com/eco-new" }),
      ]);
    });

    test("eliminar una red mediante una actualización", async () => {
      const iniciales = [
        { tipo: TipoRedSocial.GITHUB, url: "https://github.com/eco" },
        { tipo: TipoRedSocial.FACEBOOK, url: "https://facebook.com/eco" },
      ];
      const colectivo = await ctx.colectivoService.crearColectivo(
        "Eco",
        "d",
        "caba",
        "ong",
        [],
        iniciales,
      );

      // Enviamos solo github, se elimina facebook
      await ctx.colectivoService.actualizarColectivo(colectivo.id, {
        redesSociales: [{ tipo: TipoRedSocial.GITHUB, url: "https://github.com/eco" }],
      });

      let actualizado = await ctx.colectivoService.obtenerColectivoPorId(colectivo.id);
      expect(actualizado.redesSociales).toHaveLength(1);
      expect(actualizado.redesSociales[0].tipo).toBe("github");

      // Enviamos array vacío, se eliminan todas
      await ctx.colectivoService.actualizarColectivo(colectivo.id, {
        redesSociales: [],
      });

      actualizado = await ctx.colectivoService.obtenerColectivoPorId(colectivo.id);
      expect(actualizado.redesSociales).toEqual([]);
    });

    test("conservar las redes cuando la propiedad no se envía", async () => {
      const iniciales = [
        { tipo: TipoRedSocial.GITHUB, url: "https://github.com/eco" },
        { tipo: TipoRedSocial.TIKTOK, url: "https://tiktok.com/@eco" },
      ];
      const colectivo = await ctx.colectivoService.crearColectivo(
        "Eco",
        "d",
        "caba",
        "ong",
        [],
        iniciales,
      );

      await ctx.colectivoService.actualizarColectivo(colectivo.id, {
        descripcion: "Nueva descripción para la organización",
      });

      const actualizado = await ctx.colectivoService.obtenerColectivoPorId(colectivo.id);
      expect(actualizado.descripcion).toBe("Nueva descripción para la organización");
      expect(actualizado.redesSociales).toHaveLength(2);
      expect(actualizado.redesSociales.map((r) => r.tipo)).toEqual(["github", "tiktok"]);
    });

    test("rechazar tipos duplicados", async () => {
      const colectivo = await ctx.colectivoService.crearColectivo("Eco", "d", "caba", "ong");

      // En actualización
      await expectAppError(
        ctx.colectivoService.actualizarColectivo(colectivo.id, {
          redesSociales: [
            { tipo: "x", url: "https://x.com/eco1" },
            { tipo: "X", url: "https://x.com/eco2" },
          ],
        }),
        ErrorCatalog.RED_SOCIAL_TIPO_DUPLICADO,
        400,
      );

      // En creación
      await expectAppError(
        ctx.colectivoService.crearColectivo("Eco2", "d", "caba", "ong", [], [
          { tipo: TipoRedSocial.GITHUB, url: "https://github.com/eco1" },
          { tipo: TipoRedSocial.GITHUB, url: "https://github.com/eco2" },
        ]),
        ErrorCatalog.RED_SOCIAL_TIPO_DUPLICADO,
        400,
      );
    });

    test("rechazar tipos inválidos", async () => {
      const colectivo = await ctx.colectivoService.crearColectivo("Eco", "d", "caba", "ong");

      await expectAppError(
        ctx.colectivoService.actualizarColectivo(colectivo.id, {
          redesSociales: [{ tipo: "snapchat", url: "https://snapchat.com/eco" }],
        }),
        ErrorCatalog.RED_SOCIAL_TIPO_INVALIDO,
        400,
      );
    });

    test("rechazar URLs inválidas", async () => {
      const colectivo = await ctx.colectivoService.crearColectivo("Eco", "d", "caba", "ong");

      // Protocolo ftp
      await expectAppError(
        ctx.colectivoService.actualizarColectivo(colectivo.id, {
          redesSociales: [{ tipo: TipoRedSocial.GITHUB, url: "ftp://github.com/eco" }],
        }),
        ErrorCatalog.RED_SOCIAL_URL_INVALIDA,
        400,
      );

      // URL vacía
      await expectAppError(
        ctx.colectivoService.actualizarColectivo(colectivo.id, {
          redesSociales: [{ tipo: TipoRedSocial.GITHUB, url: "   " }],
        }),
        ErrorCatalog.RED_SOCIAL_URL_REQUERIDA,
        400,
      );

      // URL con formato no válido
      await expectAppError(
        ctx.colectivoService.actualizarColectivo(colectivo.id, {
          redesSociales: [{ tipo: TipoRedSocial.GITHUB, url: "no-es-una-url" }],
        }),
        ErrorCatalog.RED_SOCIAL_URL_INVALIDA,
        400,
      );
    });
  });
});
