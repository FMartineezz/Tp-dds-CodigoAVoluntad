import { RedSocial, TipoRedSocial, esUrlValida } from "../../src/models/redSocial.js";

describe("RedSocial", () => {
  test("creación de una red social válida", () => {
    const redSocial = new RedSocial(TipoRedSocial.GITHUB, "https://github.com/usuario");

    expect(redSocial).toBeInstanceOf(RedSocial);
  });

  test("conservación correcta de tipo y URL", () => {
    const redSocial = new RedSocial(TipoRedSocial.INSTAGRAM, "https://instagram.com/usuario");

    expect(redSocial.tipo).toBe(TipoRedSocial.INSTAGRAM);
    expect(redSocial.url).toBe("https://instagram.com/usuario");
  });

  test("los tipos de red social son los del enunciado", () => {
    expect(TipoRedSocial).toEqual({
      INSTAGRAM: "instagram",
      LINKEDIN: "linkedin",
      GITHUB: "github",
      FACEBOOK: "facebook",
      X: "x",
      YOUTUBE: "youtube",
      TIKTOK: "tiktok",
    });
  });

  test("esUrlValida valida protocolos HTTP y HTTPS", () => {
    expect(esUrlValida("http://ejemplo.com")).toBe(true);
    expect(esUrlValida("https://ejemplo.com/perfil")).toBe(true);
    expect(esUrlValida("ftp://ejemplo.com")).toBe(false);
    expect(esUrlValida("mailto:test@test.com")).toBe(false);
    expect(esUrlValida("")).toBe(false);
    expect(esUrlValida("   ")).toBe(false);
    expect(esUrlValida(null)).toBe(false);
    expect(esUrlValida(undefined)).toBe(false);
    expect(esUrlValida("no-url")).toBe(false);
  });
});
