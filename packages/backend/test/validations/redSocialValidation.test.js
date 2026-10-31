import {
  redSocialSchema,
  redesSocialesArraySchema,
} from "../../src/middlewares/validations/redSocialValidation.js";
import { validarActualizacionColaboradora } from "../../src/middlewares/validations/personaColaboradoraValidation.js";
import { validarActualizacionColectivo } from "../../src/middlewares/validations/colectivoValidation.js";
import { TipoRedSocial } from "../../src/models/redSocial.js";

describe("Validaciones de entrada - Redes Sociales", () => {
  describe("redSocialSchema", () => {
    test("acepta una red social válida con HTTP y HTTPS", () => {
      const httpsRes = redSocialSchema.safeParse({
        tipo: TipoRedSocial.INSTAGRAM,
        url: "https://instagram.com/usuario",
      });
      expect(httpsRes.success).toBe(true);
      expect(httpsRes.data).toEqual({
        tipo: "instagram",
        url: "https://instagram.com/usuario",
      });

      const httpRes = redSocialSchema.safeParse({
        tipo: TipoRedSocial.GITHUB,
        url: "http://github.com/usuario",
      });
      expect(httpRes.success).toBe(true);
      expect(httpRes.data.tipo).toBe("github");
    });

    test("normaliza tipos ingresados en mayúsculas a minúsculas", () => {
      const res = redSocialSchema.safeParse({
        tipo: "GITHUB",
        url: "https://github.com/usuario",
      });
      expect(res.success).toBe(true);
      expect(res.data.tipo).toBe("github");
    });

    test("rechaza tipo no perteneciente al enum", () => {
      const res = redSocialSchema.safeParse({
        tipo: "myspace",
        url: "https://myspace.com/usuario",
      });
      expect(res.success).toBe(false);
      expect(res.error.issues[0].message).toBe("RED_SOCIAL_TIPO_INVALIDO");
    });

    test("rechaza tipo ausente o no string", () => {
      const res = redSocialSchema.safeParse({
        url: "https://github.com/usuario",
      });
      expect(res.success).toBe(false);
      expect(res.error.issues[0].message).toBe("RED_SOCIAL_TIPO_REQUERIDO");
    });

    test("rechaza URL vacía", () => {
      const res = redSocialSchema.safeParse({
        tipo: TipoRedSocial.X,
        url: "   ",
      });
      expect(res.success).toBe(false);
      expect(res.error.issues[0].message).toBe("RED_SOCIAL_URL_REQUERIDA");
    });

    test("rechaza protocolos no HTTP o HTTPS", () => {
      const resFtp = redSocialSchema.safeParse({
        tipo: TipoRedSocial.X,
        url: "ftp://x.com/usuario",
      });
      expect(resFtp.success).toBe(false);
      expect(resFtp.error.issues[0].message).toBe("RED_SOCIAL_URL_INVALIDA");

      const resMailto = redSocialSchema.safeParse({
        tipo: TipoRedSocial.X,
        url: "mailto:usuario@x.com",
      });
      expect(resMailto.success).toBe(false);
      expect(resMailto.error.issues[0].message).toBe("RED_SOCIAL_URL_INVALIDA");
    });

    test("rechaza URLs no válidas", () => {
      const res = redSocialSchema.safeParse({
        tipo: TipoRedSocial.TIKTOK,
        url: "esto-no-es-una-url",
      });
      expect(res.success).toBe(false);
      expect(res.error.issues[0].message).toBe("RED_SOCIAL_URL_INVALIDA");
    });
  });

  describe("redesSocialesArraySchema", () => {
    test("acepta una lista de redes sociales válidas con distintos tipos", () => {
      const res = redesSocialesArraySchema.safeParse([
        { tipo: TipoRedSocial.GITHUB, url: "https://github.com/a" },
        { tipo: TipoRedSocial.LINKEDIN, url: "https://linkedin.com/in/a" },
        { tipo: TipoRedSocial.YOUTUBE, url: "https://youtube.com/@a" },
      ]);
      expect(res.success).toBe(true);
      expect(res.data).toHaveLength(3);
    });

    test("acepta un array vacío", () => {
      const res = redesSocialesArraySchema.safeParse([]);
      expect(res.success).toBe(true);
      expect(res.data).toEqual([]);
    });

    test("rechaza tipos duplicados sin importar mayúsculas/minúsculas", () => {
      const res = redesSocialesArraySchema.safeParse([
        { tipo: "facebook", url: "https://facebook.com/1" },
        { tipo: "FACEBOOK", url: "https://facebook.com/2" },
      ]);
      expect(res.success).toBe(false);
      expect(res.error.issues[0].message).toBe("RED_SOCIAL_TIPO_DUPLICADO");
    });

    test("rechaza cuando el valor no es un array", () => {
      const res = redesSocialesArraySchema.safeParse("no es un array");
      expect(res.success).toBe(false);
      expect(res.error.issues[0].message).toBe("RED_SOCIAL_FORMATO");
    });
  });

  describe("Middlewares de validación de actualización", () => {
    test("validarActualizacionColaboradora acepta payload parcial con redes sociales", () => {
      const req = {
        body: {
          redesSociales: [{ tipo: TipoRedSocial.GITHUB, url: "https://github.com/dev" }],
        },
      };
      let nextLlamado = false;
      validarActualizacionColaboradora(req, {}, () => {
        nextLlamado = true;
      });

      expect(nextLlamado).toBe(true);
      expect(req.body.redesSociales).toEqual([
        { tipo: "github", url: "https://github.com/dev" },
      ]);
    });

    test("validarActualizacionColectivo rechaza payload vacío con 400", () => {
      const req = { body: {} };
      expect(() => validarActualizacionColectivo(req, {}, () => {})).toThrow();
    });

    test("validarActualizacionColaboradora rechaza tipo duplicado", () => {
      const req = {
        body: {
          redesSociales: [
            { tipo: "x", url: "https://x.com/1" },
            { tipo: "x", url: "https://x.com/2" },
          ],
        },
      };
      expect(() => validarActualizacionColaboradora(req, {}, () => {})).toThrow();
    });
  });
});
