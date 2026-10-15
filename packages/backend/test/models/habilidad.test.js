import { Habilidad } from "../../src/models/habilidad.js";

describe("Habilidad", () => {
  test("guarda título y descripción, sin id hasta persistirse", () => {
    const habilidad = new Habilidad("Desarrollo Web React", "Front con React");

    expect(habilidad).toMatchObject({
      id: null,
      titulo: "Desarrollo Web React",
      descripcion: "Front con React",
    });
  });

  test("el código es el título normalizado en snake_case", () => {
    expect(new Habilidad("Desarrollo Web React", "d").codigo).toBe("desarrollo_web_react");
  });

  test("la normalización ignora mayúsculas y signos", () => {
    expect(new Habilidad("  Node.JS & Express!  ", "d").codigo).toBe("node_js_express");
  });

  test("los números quedan separados por guiones bajos", () => {
    // Comportamiento de lodash.snakeCase: conviene tenerlo en cuenta al cargar habilidades
    expect(new Habilidad("Testing E2E", "d").codigo).toBe("testing_e_2_e");
  });
});
