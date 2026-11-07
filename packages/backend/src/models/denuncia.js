export const EstadoDenuncia = Object.freeze({
  PENDIENTE: "pendiente",
  EN_REVISION: "en_revision",
  RESUELTA: "resuelta",
  DESCARTADA: "descartada",
});

export class Denuncia {
  constructor(descripcion, colaboracionId) {
    this.id = null;
    this.descripcion = descripcion;
    this.fecha = new Date();
    this.estado = EstadoDenuncia.PENDIENTE;
    this.colaboracionId = colaboracionId;
  }
}
