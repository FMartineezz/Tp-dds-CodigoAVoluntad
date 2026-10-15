import { Colectivo, TipoColectivo, UBICACION_VALIDA } from "../../src/models/colectivo.js";

describe("Colectivo", () => {
  test("se crea sin proyectos y con ubicación opcional", () => {
    const colectivo = new Colectivo("Asamblea Norte", "Asamblea barrial", undefined, "asamblea");

    expect(colectivo).toMatchObject({
      id: null,
      nombre: "Asamblea Norte",
      ubicacion: null,
      tipoDeColectivo: "asamblea",
      proyectos: [],
    });
  });

  test("cargarProyecto agrega el proyecto y le asigna el colectivo", () => {
    const colectivo = new Colectivo("Fundación", "d", "caba", TipoColectivo.FUNDACION);
    const proyecto = { titulo: "Web" };

    colectivo.cargarProyecto(proyecto);

    expect(colectivo.proyectos).toEqual([proyecto]);
    expect(proyecto.colectivo).toBe(colectivo);
  });

  test("los tipos de colectivo son los del enunciado", () => {
    expect(Object.values(TipoColectivo)).toEqual([
      "fundacion",
      "ong",
      "asociacion barrial",
      "asamblea",
    ]);
  });

  test("las ubicaciones válidas son Argentina, CABA y las 23 provincias", () => {
    expect(UBICACION_VALIDA.size).toBe(25);
    expect(UBICACION_VALIDA.has("argentina")).toBe(true);
    expect(UBICACION_VALIDA.has("caba")).toBe(true);
  });
});
