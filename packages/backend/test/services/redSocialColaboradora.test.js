import ErrorCatalog from "../../src/errors/errorCatalog.js";
import { TipoRedSocial } from "../../src/models/redSocial.js";
import { crearContexto, expectAppError } from "../helpers/crearContexto.js";

describe("PersonaColaboradoraService - Redes Sociales", () => {
  let ctx;

  const crearColaboradora = (redesSociales = []) =>
    ctx.personaColaboradoraService.crearPersonaColaboradora(
      "DevSolidaria",
      "https://github.com/solidaria",
      "María",
      "González",
      ["desarrollo_web_react"],
      "ella",
      "Desarrolladora solidaria",
      [],
      false,
      redesSociales,
    );

  beforeEach(async () => {
    ctx = crearContexto();
    await ctx.habilidadService.crearHabilidad("Desarrollo Web React", "d");
  });

  test("crear un perfil sin redes sociales", async () => {
    const colab = await crearColaboradora();

    expect(colab.redesSociales).toEqual([]);
    const recuperada = await ctx.personaColaboradoraService.obtenerPersonaColaboradoraPorId(
      colab.id,
    );
    expect(recuperada.redesSociales).toEqual([]);
  });

  test("crear un perfil con varias redes sociales", async () => {
    const redes = [
      { tipo: TipoRedSocial.GITHUB, url: "https://github.com/solidaria" },
      { tipo: TipoRedSocial.LINKEDIN, url: "https://linkedin.com/in/solidaria" },
    ];
    const colab = await crearColaboradora(redes);

    expect(colab.redesSociales).toHaveLength(2);
    expect(colab.redesSociales[0].tipo).toBe("github");
    expect(colab.redesSociales[1].tipo).toBe("linkedin");
  });

  test("actualizar las redes sociales existentes", async () => {
    const redes = [
      { tipo: TipoRedSocial.GITHUB, url: "https://github.com/solidaria" },
      { tipo: TipoRedSocial.LINKEDIN, url: "https://linkedin.com/in/solidaria" },
    ];
    const colab = await crearColaboradora(redes);

    await ctx.personaColaboradoraService.actualizarPersonaColaboradora(colab.id, {
      redesSociales: [
        { tipo: TipoRedSocial.GITHUB, url: "https://github.com/solidaria-dev" },
        { tipo: TipoRedSocial.LINKEDIN, url: "https://linkedin.com/in/solidaria" },
      ],
    });

    const actualizada = await ctx.personaColaboradoraService.obtenerPersonaColaboradoraPorId(
      colab.id,
    );
    expect(actualizada.redesSociales).toHaveLength(2);
    expect(actualizada.redesSociales[0].url).toBe("https://github.com/solidaria-dev");
  });

  test("agregar una red nueva", async () => {
    const colab = await crearColaboradora([
      { tipo: TipoRedSocial.GITHUB, url: "https://github.com/solidaria" },
    ]);

    await ctx.personaColaboradoraService.actualizarPersonaColaboradora(colab.id, {
      redesSociales: [
        { tipo: TipoRedSocial.GITHUB, url: "https://github.com/solidaria" },
        { tipo: TipoRedSocial.X, url: "https://x.com/solidaria" },
      ],
    });

    const actualizada = await ctx.personaColaboradoraService.obtenerPersonaColaboradoraPorId(
      colab.id,
    );
    expect(actualizada.redesSociales).toHaveLength(2);
    expect(actualizada.redesSociales.map((r) => r.tipo)).toEqual(["github", "x"]);
  });

  test("reemplazar la URL de una red existente", async () => {
    const colab = await crearColaboradora([
      { tipo: TipoRedSocial.LINKEDIN, url: "https://linkedin.com/in/solidaria-old" },
    ]);

    await ctx.personaColaboradoraService.actualizarPersonaColaboradora(colab.id, {
      redesSociales: [{ tipo: TipoRedSocial.LINKEDIN, url: "https://linkedin.com/in/solidaria-new" }],
    });

    const actualizada = await ctx.personaColaboradoraService.obtenerPersonaColaboradoraPorId(
      colab.id,
    );
    expect(actualizada.redesSociales).toEqual([
      expect.objectContaining({ tipo: "linkedin", url: "https://linkedin.com/in/solidaria-new" }),
    ]);
  });

  test("eliminar una red mediante una actualización", async () => {
    const colab = await crearColaboradora([
      { tipo: TipoRedSocial.GITHUB, url: "https://github.com/solidaria" },
      { tipo: TipoRedSocial.TIKTOK, url: "https://tiktok.com/@solidaria" },
    ]);

    // Eliminamos tiktok enviando solo github
    await ctx.personaColaboradoraService.actualizarPersonaColaboradora(colab.id, {
      redesSociales: [{ tipo: TipoRedSocial.GITHUB, url: "https://github.com/solidaria" }],
    });

    let actualizada = await ctx.personaColaboradoraService.obtenerPersonaColaboradoraPorId(
      colab.id,
    );
    expect(actualizada.redesSociales).toHaveLength(1);
    expect(actualizada.redesSociales[0].tipo).toBe("github");

    // Vaciamos todas enviando array vacío []
    await ctx.personaColaboradoraService.actualizarPersonaColaboradora(colab.id, {
      redesSociales: [],
    });

    actualizada = await ctx.personaColaboradoraService.obtenerPersonaColaboradoraPorId(colab.id);
    expect(actualizada.redesSociales).toEqual([]);
  });

  test("conservar las redes cuando la propiedad no se envía", async () => {
    const colab = await crearColaboradora([
      { tipo: TipoRedSocial.GITHUB, url: "https://github.com/solidaria" },
      { tipo: TipoRedSocial.YOUTUBE, url: "https://youtube.com/@solidaria" },
    ]);

    await ctx.personaColaboradoraService.actualizarPersonaColaboradora(colab.id, {
      presentacion: "Nueva presentación actualizada",
    });

    const conservada = await ctx.personaColaboradoraService.obtenerPersonaColaboradoraPorId(
      colab.id,
    );
    expect(conservada.presentacion).toBe("Nueva presentación actualizada");
    expect(conservada.redesSociales).toHaveLength(2);
    expect(conservada.redesSociales.map((r) => r.tipo)).toEqual(["github", "youtube"]);
  });

  test("rechazar tipos duplicados", async () => {
    const colab = await crearColaboradora();

    // En actualización
    await expectAppError(
      ctx.personaColaboradoraService.actualizarPersonaColaboradora(colab.id, {
        redesSociales: [
          { tipo: "instagram", url: "https://instagram.com/user1" },
          { tipo: "INSTAGRAM", url: "https://instagram.com/user2" },
        ],
      }),
      ErrorCatalog.RED_SOCIAL_TIPO_DUPLICADO,
      400,
    );

    // En creación
    await expectAppError(
      ctx.personaColaboradoraService.crearPersonaColaboradora(
        "Otra",
        "g",
        null,
        null,
        ["desarrollo_web_react"],
        null,
        "H",
        [],
        false,
        [
          { tipo: TipoRedSocial.GITHUB, url: "https://github.com/user1" },
          { tipo: TipoRedSocial.GITHUB, url: "https://github.com/user2" },
        ],
      ),
      ErrorCatalog.RED_SOCIAL_TIPO_DUPLICADO,
      400,
    );
  });

  test("rechazar tipos inválidos", async () => {
    const colab = await crearColaboradora();

    await expectAppError(
      ctx.personaColaboradoraService.actualizarPersonaColaboradora(colab.id, {
        redesSociales: [{ tipo: "plataforma_invalida", url: "https://sitio.com/user" }],
      }),
      ErrorCatalog.RED_SOCIAL_TIPO_INVALIDO,
      400,
    );
  });

  test("rechazar URLs inválidas", async () => {
    const colab = await crearColaboradora();

    // Protocolo no permitido (ftp)
    await expectAppError(
      ctx.personaColaboradoraService.actualizarPersonaColaboradora(colab.id, {
        redesSociales: [{ tipo: TipoRedSocial.GITHUB, url: "ftp://github.com/user" }],
      }),
      ErrorCatalog.RED_SOCIAL_URL_INVALIDA,
      400,
    );

    // URL vacía
    await expectAppError(
      ctx.personaColaboradoraService.actualizarPersonaColaboradora(colab.id, {
        redesSociales: [{ tipo: TipoRedSocial.GITHUB, url: "" }],
      }),
      ErrorCatalog.RED_SOCIAL_URL_REQUERIDA,
      400,
    );

    // URL no parseable
    await expectAppError(
      ctx.personaColaboradoraService.actualizarPersonaColaboradora(colab.id, {
        redesSociales: [{ tipo: TipoRedSocial.GITHUB, url: "invalida" }],
      }),
      ErrorCatalog.RED_SOCIAL_URL_INVALIDA,
      400,
    );
  });
});
