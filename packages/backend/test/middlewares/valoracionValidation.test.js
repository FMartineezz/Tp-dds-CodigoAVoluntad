import { jest } from "@jest/globals";
import { valoracionSchema, validarValoracion } from "../../src/middlewares/validations/valoracionValidation.js";
import { TipoEvaluador } from "../../src/models/valoracion.js";
import { AppError } from "../../src/errors/appError.js";
import ErrorCatalog from "../../src/errors/errorCatalog.js";

describe("Validaciones de Valoración", () => {
  describe("valoracionSchema (Zod)", () => {
    test("acepta un payload válido con comentario", () => {
      const datos = {
        colaboracionId: "60c72b2f9b1d8b2badfee123",
        evaluador: TipoEvaluador.PERSONA,
        puntaje: 5,
        comentario: "Excelente experiencia colaborando con el colectivo",
      };

      const resultado = valoracionSchema.safeParse(datos);
      expect(resultado.success).toBe(true);
      expect(resultado.data.puntaje).toBe(5);
    });

    test("acepta un payload sin comentario (comentario opcional)", () => {
      const datos = {
        colaboracionId: "60c72b2f9b1d8b2badfee123",
        evaluador: TipoEvaluador.COLECTIVO,
        puntaje: 3,
      };

      const resultado = valoracionSchema.safeParse(datos);
      expect(resultado.success).toBe(true);
    });

    test("ignora y no permite establecer manualmente autor ni destinatario desde el request", () => {
      const datos = {
        colaboracionId: "60c72b2f9b1d8b2badfee123",
        evaluador: TipoEvaluador.PERSONA,
        puntaje: 4,
        autor: "intento_inyeccion_autor",
        destinatario: "intento_inyeccion_destinatario",
      };

      const resultado = valoracionSchema.safeParse(datos);
      expect(resultado.success).toBe(true);
      expect(resultado.data).not.toHaveProperty("autor");
      expect(resultado.data).not.toHaveProperty("destinatario");
      expect(resultado.data).not.toHaveProperty("evaluadorId");
    });

    test("rechaza puntaje menor a 1", () => {
      const datos = {
        colaboracionId: "60c72b2f9b1d8b2badfee123",
        evaluador: TipoEvaluador.PERSONA,
        puntaje: 0,
      };

      const resultado = valoracionSchema.safeParse(datos);
      expect(resultado.success).toBe(false);
      expect(resultado.error.issues[0].message).toBe("VALORACION_PUNTAJE_RANGO");
    });

    test("rechaza puntaje mayor a 5", () => {
      const datos = {
        colaboracionId: "60c72b2f9b1d8b2badfee123",
        evaluador: TipoEvaluador.PERSONA,
        puntaje: 6,
      };

      const resultado = valoracionSchema.safeParse(datos);
      expect(resultado.success).toBe(false);
      expect(resultado.error.issues[0].message).toBe("VALORACION_PUNTAJE_RANGO");
    });

    test("rechaza puntaje decimal (debe ser entero)", () => {
      const datos = {
        colaboracionId: "60c72b2f9b1d8b2badfee123",
        evaluador: TipoEvaluador.PERSONA,
        puntaje: 4.5,
      };

      const resultado = valoracionSchema.safeParse(datos);
      expect(resultado.success).toBe(false);
      expect(resultado.error.issues[0].message).toBe("VALORACION_PUNTAJE_FORMATO");
    });

    test("rechaza puntaje no numérico", () => {
      const datos = {
        colaboracionId: "60c72b2f9b1d8b2badfee123",
        evaluador: TipoEvaluador.PERSONA,
        puntaje: "cinco",
      };

      const resultado = valoracionSchema.safeParse(datos);
      expect(resultado.success).toBe(false);
      expect(resultado.error.issues[0].message).toBe("VALORACION_PUNTAJE_FORMATO");
    });

    test("rechaza comentario que supera 500 caracteres", () => {
      const datos = {
        colaboracionId: "60c72b2f9b1d8b2badfee123",
        evaluador: TipoEvaluador.COLECTIVO,
        puntaje: 4,
        comentario: "a".repeat(501),
      };

      const resultado = valoracionSchema.safeParse(datos);
      expect(resultado.success).toBe(false);
      expect(resultado.error.issues[0].message).toBe("VALORACION_COMENTARIO_LARGO");
    });

    test("rechaza tipo de evaluador inválido", () => {
      const datos = {
        colaboracionId: "60c72b2f9b1d8b2badfee123",
        evaluador: "administrador",
        puntaje: 5,
      };

      const resultado = valoracionSchema.safeParse(datos);
      expect(resultado.success).toBe(false);
      expect(resultado.error.issues[0].message).toBe("VALORACION_EVALUADOR_TIPO_FORMATO");
    });

    test("rechaza colaboracionId faltante o nulo", () => {
      const datos = {
        evaluador: TipoEvaluador.PERSONA,
        puntaje: 5,
      };

      const resultado = valoracionSchema.safeParse(datos);
      expect(resultado.success).toBe(false);
      expect(resultado.error.issues[0].message).toBe("VALORACION_COLABORACION_ID_INVALIDO");
    });
  });

  describe("Middleware validarValoracion", () => {
    test("llama a next() y normaliza req.body ante datos válidos", () => {
      const req = {
        body: {
          colaboracionId: "60c72b2f9b1d8b2badfee123",
          evaluador: TipoEvaluador.COLECTIVO,
          puntaje: 5,
          comentario: "  Muy buen trabajo  ",
        },
      };
      const res = {};
      const next = jest.fn();

      validarValoracion(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.body.comentario).toBe("Muy buen trabajo");
    });

    test("lanza AppError con status 400 ante datos inválidos", () => {
      const req = {
        body: {
          colaboracionId: "60c72b2f9b1d8b2badfee123",
          evaluador: "invalido",
          puntaje: 5,
        },
      };
      const res = {};
      const next = jest.fn();

      expect(() => validarValoracion(req, res, next)).toThrow(AppError);
      expect(() => validarValoracion(req, res, next)).toThrow(
        expect.objectContaining({
          code: ErrorCatalog.VALORACION_EVALUADOR_TIPO_FORMATO.code,
          statusCode: 400,
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });
  });
});
