import { Denuncia, EstadoDenuncia } from "../../src/models/denuncia.js";

describe("Denuncia Model", () => {
  test("se crea con estado inicial PENDIENTE y fecha automática", () => {
    const colaboracionId = "60c72b2f9b1d8b2bad000001";
    const denuncia = new Denuncia("Mal comportamiento reiterado", colaboracionId);

    expect(denuncia.descripcion).toBe("Mal comportamiento reiterado");
    expect(denuncia.colaboracionId).toBe(colaboracionId);
    expect(denuncia.estado).toBe(EstadoDenuncia.PENDIENTE);
    expect(denuncia.fecha).toBeInstanceOf(Date);
    expect(denuncia.id).toBeNull();
  });

  test("la clase es anémica y no expone denunciante ni personaId", () => {
    const denuncia = new Denuncia("Descripción", "colab123");

    expect(denuncia).not.toHaveProperty("denunciante");
    expect(denuncia).not.toHaveProperty("personaId");
    expect(denuncia).not.toHaveProperty("personaColaboradora");
  });

  test("el enum EstadoDenuncia contiene los estados requeridos", () => {
    expect(EstadoDenuncia).toMatchObject({
      PENDIENTE: "pendiente",
      EN_REVISION: "en_revision",
      RESUELTA: "resuelta",
      DESCARTADA: "descartada",
    });
  });
});
