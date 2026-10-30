import { jest } from "@jest/globals";
import validarProyecto, {
  validarActualizacionProyecto,
} from "../../src/middlewares/validations/proyectoValidation.js";
import ErrorCatalog from "../../src/errors/errorCatalog.js";

describe("proyectoValidation middleware", () => {
  const next = jest.fn();

  beforeEach(() => {
    next.mockClear();
  });

  describe("validarProyecto (POST)", () => {
    const reqBase = {
      body: {
        titulo: "Proyecto Validacion",
        descripcion: "Descripcion",
        colectivo: "Fundación Ejemplo",
        urlSistema: "https://ejemplo.org",
        perfiles: [
          {
            descripcion: "Dev",
            habilidadesRequeridas: ["react"],
            habilidadesOpcionales: [],
            horas: 5,
            tipoDeCompromiso: "mensual",
            modalidadDeColaboracion: "gratuita",
          },
        ],
      },
    };

    test("acepta body con urlDonaciones válida", () => {
      const req = {
        body: {
          ...reqBase.body,
          urlDonaciones: "https://cafecito.app/ejemplo",
        },
      };
      validarProyecto(req, {}, next);
      expect(next).toHaveBeenCalled();
    });

    test("acepta body sin urlDonaciones", () => {
      const req = { body: { ...reqBase.body } };
      validarProyecto(req, {}, next);
      expect(next).toHaveBeenCalled();
    });

    test("acepta body con urlDonaciones null o vacía", () => {
      const reqNull = { body: { ...reqBase.body, urlDonaciones: null } };
      validarProyecto(reqNull, {}, next);
      expect(next).toHaveBeenCalled();

      next.mockClear();
      const reqVacia = { body: { ...reqBase.body, urlDonaciones: "" } };
      validarProyecto(reqVacia, {}, next);
      expect(next).toHaveBeenCalled();
    });

    test("rechaza urlDonaciones con URL inválida", () => {
      const req = {
        body: {
          ...reqBase.body,
          urlDonaciones: "no-url",
        },
      };
      expect(() => validarProyecto(req, {}, next)).toThrow();
    });

    test("rechaza urlDonaciones con protocolo no HTTP/HTTPS", () => {
      const req = {
        body: {
          ...reqBase.body,
          urlDonaciones: "ftp://cafecito.app",
        },
      };
      expect(() => validarProyecto(req, {}, next)).toThrow();
    });
  });

  describe("validarActualizacionProyecto (PATCH)", () => {
    test("acepta actualizar solo urlDonaciones", () => {
      const req = {
        body: {
          urlDonaciones: "https://cafecito.app/modificada",
        },
      };
      validarActualizacionProyecto(req, {}, next);
      expect(next).toHaveBeenCalled();
      expect(req.body.urlDonaciones).toBe("https://cafecito.app/modificada");
    });

    test("acepta urlDonaciones null o vacía para eliminar enlace", () => {
      const reqNull = { body: { urlDonaciones: null } };
      validarActualizacionProyecto(reqNull, {}, next);
      expect(next).toHaveBeenCalled();

      next.mockClear();
      const reqVacia = { body: { urlDonaciones: "" } };
      validarActualizacionProyecto(reqVacia, {}, next);
      expect(next).toHaveBeenCalled();
    });

    test("acepta finalizado y urlDonaciones", () => {
      const req = {
        body: {
          finalizado: true,
          urlDonaciones: "https://cafecito.app/final",
        },
      };
      validarActualizacionProyecto(req, {}, next);
      expect(next).toHaveBeenCalled();
    });

    test("rechaza body vacío", () => {
      const req = { body: {} };
      expect(() => validarActualizacionProyecto(req, {}, next)).toThrow();
    });

    test("rechaza campos no permitidos", () => {
      const req = { body: { titulo: "Nuevo titulo" } };
      expect(() => validarActualizacionProyecto(req, {}, next)).toThrow();
    });

    test("rechaza urlDonaciones inválida", () => {
      const req = { body: { urlDonaciones: "not-a-url" } };
      expect(() => validarActualizacionProyecto(req, {}, next)).toThrow();
    });

    test("rechaza protocolo no HTTP/HTTPS", () => {
      const req = { body: { urlDonaciones: "ftp://servidor/donar" } };
      expect(() => validarActualizacionProyecto(req, {}, next)).toThrow();
    });
  });
});
