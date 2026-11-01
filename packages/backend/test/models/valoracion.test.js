import { Valoracion, TipoEvaluador } from "../../src/models/valoracion.js";

describe("Modelo Valoracion", () => {
  test("TipoEvaluador define PERSONA y COLECTIVO", () => {
    expect(TipoEvaluador.PERSONA).toBe("persona");
    expect(TipoEvaluador.COLECTIVO).toBe("colectivo");
    expect(Object.isFrozen(TipoEvaluador)).toBe(true);
  });

  test("crea una instancia de Valoracion con todos sus atributos", () => {
    const colaboracionId = "60c72b2f9b1d8b2badfee123";
    const autorId = "60c72b2f9b1d8b2badfee456";
    const destinatarioId = "60c72b2f9b1d8b2badfee789";

    const valoracion = new Valoracion(
      colaboracionId,
      TipoEvaluador.COLECTIVO,
      5,
      "Gran trabajo y compromiso",
      autorId,
      destinatarioId,
    );

    expect(valoracion.id).toBeNull();
    expect(valoracion.colaboracion).toBe(colaboracionId);
    expect(valoracion.evaluador).toBe(TipoEvaluador.COLECTIVO);
    expect(valoracion.puntaje).toBe(5);
    expect(valoracion.comentario).toBe("Gran trabajo y compromiso");
    expect(valoracion.autor).toBe(autorId);
    expect(valoracion.destinatario).toBe(destinatarioId);
  });

  test("permite comentario opcional por defecto null", () => {
    const valoracion = new Valoracion("colab-1", TipoEvaluador.PERSONA, 4);

    expect(valoracion.comentario).toBeNull();
    expect(valoracion.autor).toBeNull();
    expect(valoracion.destinatario).toBeNull();
  });
});
