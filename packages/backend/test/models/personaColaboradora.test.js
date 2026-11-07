import { PersonaColaboradora, TipoMedioDeContacto } from "../../src/models/personaColaboradora.js";
import { Colaboracion } from "../../src/models/colaboracion.js";
import { Mensaje } from "../../src/models/mensaje.js";

describe("PersonaColaboradora", () => {
  test("solo exige nombre de fantasía y git; el resto tiene valores por defecto", () => {
    const persona = new PersonaColaboradora("Ana", "github.com/ana");

    expect(persona).toMatchObject({
      id: null,
      nombreFantasia: "Ana",
      git: "github.com/ana",
      nombre: null,
      apellido: null,
      habilidades: [],
      pronombres: null,
      presentacion: null,
      contactos: [],
      bloquearMensajeInterno: false,
    });
  });

  test("los medios de contacto son email, WhatsApp y SMS", () => {
    expect(Object.values(TipoMedioDeContacto)).toEqual(["email", "whatsapp", "sms"]);
  });
});

describe("Colaboracion", () => {
  test("por defecto no es anónima", () => {
    expect(new Colaboracion({}, {}).anonima).toBe(false);
  });

  test("puede marcarse como anónima", () => {
    expect(new Colaboracion({}, {}, true).anonima).toBe(true);
  });
});

describe("Mensaje", () => {
  test("registra la fecha de creación", () => {
    const antes = new Date();
    const mensaje = new Mensaje({ nombre: "Colectivo" }, { nombreFantasia: "Ana" }, "Hola");

    expect(mensaje.texto).toBe("Hola");
    expect(mensaje.date.getTime()).toBeGreaterThanOrEqual(antes.getTime());
  });
});
