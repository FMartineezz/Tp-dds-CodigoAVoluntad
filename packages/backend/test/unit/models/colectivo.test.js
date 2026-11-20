import { Colectivo, TipoColectivo, UBICACION_VALIDA } from "../../../src/models/colectivo.js";

describe("Colectivo", () => {
  test("se crea sin proyectos y con ubicación opcional", () => {
    // Ejecución
    const colectivo = new Colectivo("Asamblea Norte", "Asamblea barrial", undefined, "asamblea");

    // Validación
    expect(colectivo).toMatchObject({
      id: null,
      nombre: "Asamblea Norte",
      ubicacion: null,
      tipoDeColectivo: "asamblea",
      proyectos: [],
    });
  });

  describe("cargarProyecto", () => {
    test("agrega el proyecto y le asigna el colectivo", () => {
      // Preparación
      const colectivo = new Colectivo("Fundación", "d", "caba", TipoColectivo.FUNDACION);
      const proyecto = { titulo: "Web" };

      // Ejecución
      colectivo.cargarProyecto(proyecto);

      // Validación
      expect(colectivo.proyectos).toEqual([proyecto]);
      expect(proyecto.colectivo).toBe(colectivo);
    });

    test("acumula proyectos en el orden en que se cargan", () => {
      // Preparación
      const colectivo = new Colectivo("Fundación", "d", "caba", TipoColectivo.FUNDACION);
      const web = { titulo: "Web" };
      const app = { titulo: "App" };

      // Ejecución
      colectivo.cargarProyecto(web);
      colectivo.cargarProyecto(app);

      // Validación
      expect(colectivo.proyectos).toEqual([web, app]);
    });
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
