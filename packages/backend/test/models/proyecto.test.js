import { Proyecto, TipoCompromiso, ModalidadColaboracion } from "../../src/models/proyecto.js";
import { Perfil } from "../../src/models/perfil.js";
import { Logro } from "../../src/models/logro.js";

describe("Proyecto", () => {
  test("se crea abierto, sin logros y con la URL del sistema", () => {
    const perfil = new Perfil("Front", [], [], 5, TipoCompromiso.MENSUAL, "gratuita");
    const proyecto = new Proyecto(
      "Web",
      "Sitio",
      [perfil],
      { nombre: "Colectivo" },
      "https://web.org",
    );

    expect(proyecto).toMatchObject({
      id: null,
      titulo: "Web",
      perfiles: [perfil],
      urlSistema: "https://web.org",
      logros: [],
      finalizado: false,
    });
  });

  test("soporta atributo opcional urlDonaciones", () => {
    const perfil = new Perfil("Front", [], [], 5, TipoCompromiso.MENSUAL, "gratuita");
    const proyectoConDonacion = new Proyecto(
      "Web",
      "Sitio",
      [perfil],
      { nombre: "Colectivo" },
      "https://web.org",
      undefined,
      undefined,
      "https://cafecito.app/mi-proyecto",
    );
    expect(proyectoConDonacion.urlDonaciones).toBe("https://cafecito.app/mi-proyecto");

    const proyectoSinDonacion = new Proyecto(
      "Web",
      "Sitio",
      [perfil],
      { nombre: "Colectivo" },
      "https://web.org",
    );
    expect(proyectoSinDonacion.urlDonaciones).toBeNull();

    const proyectoDonacionVacia = new Proyecto(
      "Web",
      "Sitio",
      [perfil],
      { nombre: "Colectivo" },
      "https://web.org",
      undefined,
      undefined,
      "",
    );
    expect(proyectoDonacionVacia.urlDonaciones).toBeNull();
  });

  test("tipos de compromiso y modalidades disponibles", () => {
    expect(Object.values(TipoCompromiso)).toEqual(["total", "semanal", "mensual"]);
    expect(Object.values(ModalidadColaboracion)).toEqual([
      "gratuita",
      "incentivo_economico",
      "contratacion_eventual",
    ]);
  });
});

describe("Perfil", () => {
  test("guarda habilidades requeridas, opcionales y el compromiso", () => {
    const perfil = new Perfil("Tester", ["cypress"], ["soap_ui"], 5, "mensual", "gratuita");

    expect(perfil).toMatchObject({
      id: null,
      descripcion: "Tester",
      habilidadesRequeridas: ["cypress"],
      habilidadesOpcionales: ["soap_ui"],
      horas: 5,
      tipoDeCompromiso: "mensual",
      modalidadDeColaboracion: "gratuita",
    });
  });
});

describe("Logro", () => {
  test("guarda descripción, porcentaje y URL del código fuente", () => {
    expect(new Logro("MVP", 40, "https://github.com/x")).toEqual({
      id: null,
      descripcion: "MVP",
      porcentaje: 40,
      urlCodigoFuente: "https://github.com/x",
    });
  });
});
