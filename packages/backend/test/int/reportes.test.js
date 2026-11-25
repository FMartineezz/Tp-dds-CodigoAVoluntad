import request from "supertest";
import { app } from "./utils/app.js";
import { usarBaseDeDatos } from "../utils/db.js";
import ErrorCatalog from "../../src/errors/errorCatalog.js";
import { ReporteModel } from "../../src/schemas/reporteSchema.js";
import { LARGO_MAXIMO_DESCRIPCION_REPORTE } from "../../src/middlewares/validations/reporteValidation.js";

usarBaseDeDatos();

const reportar = (body) => request(app).post("/reportes").send(body);

describe("Reportes de problemas (HTTP)", () => {
  describe("POST /reportes", () => {
    test("responde 201 con el reporte nuevo y lo guarda", async () => {
      // Ejecución
      const respuesta = await reportar({
        tipo: "error",
        descripcion: "  El botón Guardar no hace nada  ",
        pantalla: "/org/proyectos/nuevo",
        correo: "persona@correo.org",
      });

      // Validación
      expect(respuesta.status).toBe(201);
      expect(respuesta.body).toMatchObject({
        tipo: "error",
        descripcion: "El botón Guardar no hace nada",
        pantalla: "/org/proyectos/nuevo",
        correo: "persona@correo.org",
        estado: "nuevo",
      });
      expect(respuesta.body.id).toBeDefined();
      expect(await ReporteModel.countDocuments()).toBe(1);
    });

    test("la pantalla y el correo son opcionales (vacíos cuentan como que no vinieron)", async () => {
      // Ejecución
      const respuesta = await reportar({
        tipo: "sugerencia",
        descripcion: "Estaría bueno un modo oscuro",
        pantalla: "",
        correo: "   ",
      });

      // Validación
      expect(respuesta.status).toBe(201);
      expect(respuesta.body).toMatchObject({ pantalla: null, correo: null });
    });

    test("ignora campos que no son del reporte (por ejemplo, el estado)", async () => {
      // Ejecución
      const respuesta = await reportar({
        tipo: "otro",
        descripcion: "Algo",
        estado: "resuelto",
      });

      // Validación
      expect(respuesta.status).toBe(201);
      expect(respuesta.body.estado).toBe("nuevo");
    });

    test.each([
      [{ descripcion: "Algo" }, ErrorCatalog.REPORTE_TIPO_INVALIDO.code],
      [{ tipo: "queja", descripcion: "Algo" }, ErrorCatalog.REPORTE_TIPO_INVALIDO.code],
      [{ tipo: "error" }, ErrorCatalog.REPORTE_DESCRIPCION_REQUERIDA.code],
      [{ tipo: "error", descripcion: "   " }, ErrorCatalog.REPORTE_DESCRIPCION_REQUERIDA.code],
      [
        { tipo: "error", descripcion: "x".repeat(LARGO_MAXIMO_DESCRIPCION_REPORTE + 1) },
        ErrorCatalog.REPORTE_DESCRIPCION_MUY_LARGA.code,
      ],
      [
        { tipo: "error", descripcion: "Algo", correo: "no-es-un-correo" },
        ErrorCatalog.REPORTE_CORREO_INVALIDO.code,
      ],
    ])("responde 400 con %o", async (body, codigo) => {
      // Ejecución
      const respuesta = await reportar(body);

      // Validación
      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe(codigo);
      expect(await ReporteModel.countDocuments()).toBe(0);
    });
  });
});
