import { Habilidad } from "../../../src/models/habilidad.js";

describe("Habilidad", () => {
  test("guarda título y descripción, sin id hasta persistirse", () => {
    // Ejecución
    const habilidad = new Habilidad("Desarrollo Web React", "Front con React");

    // Validación
    expect(habilidad).toMatchObject({
      id: null,
      titulo: "Desarrollo Web React",
      descripcion: "Front con React",
    });
  });

  // El código es el título normalizado en snake_case (lodash.snakeCase)
  test.each([
    ["Desarrollo Web React", "desarrollo_web_react"],
    ["  Node.JS & Express!  ", "node_js_express"],
    // Los números quedan separados por guiones bajos: conviene tenerlo en cuenta al cargar habilidades
    ["Testing E2E", "testing_e_2_e"],
  ])("el código de %j es %j", (titulo, codigoEsperado) => {
    expect(new Habilidad(titulo, "d").codigo).toBe(codigoEsperado);
  });
});
