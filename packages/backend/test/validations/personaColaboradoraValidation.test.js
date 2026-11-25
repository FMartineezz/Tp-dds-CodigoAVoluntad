import { colaboradoraSchema } from "../../src/middlewares/validations/personaColaboradoraValidation.js";

// Solo los campos nuevos de la colaboradora (foto y sitio web); el resto se prueba por HTTP
describe("Validaciones de entrada - Colaboradora", () => {
  const actualizacion = colaboradoraSchema.partial();

  test("acepta foto y sitio web con URL http o https", () => {
    const resultado = actualizacion.safeParse({
      foto: "https://imagenes.test/ana.jpg",
      sitioWeb: "http://ana.dev",
    });

    expect(resultado.success).toBe(true);
  });

  test("acepta null para borrar la foto o el sitio web", () => {
    const resultado = actualizacion.safeParse({ foto: null, sitioWeb: null });

    expect(resultado.success).toBe(true);
  });

  test("rechaza una foto que no es URL", () => {
    const resultado = actualizacion.safeParse({ foto: "ana.jpg" });

    expect(resultado.error.issues[0].message).toBe("COLABORADORA_FOTO_INVALIDA");
  });

  test("rechaza un sitio web sin protocolo http/https", () => {
    const resultado = actualizacion.safeParse({ sitioWeb: "ftp://ana.dev" });

    expect(resultado.error.issues[0].message).toBe("COLABORADORA_SITIO_WEB_INVALIDO");
  });
});
