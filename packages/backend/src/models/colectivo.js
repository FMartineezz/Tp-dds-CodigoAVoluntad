/** Ubicaciones aceptadas: Argentina, CABA o una de las 23 provincias (minúsculas, sin tildes). */
const UBICACION_VALIDA = new Set([
  "argentina",
  "caba",
  "buenos aires",
  "catamarca",
  "chaco",
  "chubut",
  "cordoba",
  "corrientes",
  "entre rios",
  "formosa",
  "jujuy",
  "la pampa",
  "la rioja",
  "mendoza",
  "misiones",
  "neuquen",
  "rio negro",
  "salta",
  "san juan",
  "san luis",
  "santa cruz",
  "santa fe",
  "santiago del estero",
  "tierra del fuego",
  "tucuman",
]);

/** Tipos de colectivo. */
const TipoColectivo = Object.freeze({
  FUNDACION: "fundacion",
  ONG: "ong",
  ASOCIACION_BARRIAL: "asociacion barrial",
  ASAMBLEA: "asamblea",
});

/** @typedef {import("../types.js").Id} Id */

/**
 * Organización que lleva adelante una causa y publica proyectos.
 */
class Colectivo {
  /**
   * @param {string} nombre
   * @param {string} descripcion
   * @param {string | null} ubicacion Uno de UBICACION_VALIDA, o null.
   * @param {typeof TipoColectivo[keyof typeof TipoColectivo]} tipoDeColectivo
   * @param {Array<Id | object>} [proyectos] Ids o proyectos (ver cargarProyecto).
   * @param {import("./redSocial.js").RedSocial[]} [redesSociales]
   */
  constructor(
    nombre,
    descripcion,
    ubicacion = null,
    tipoDeColectivo,
    keycloackId,
    redesSociales = [],
  ) {
    /** @type {Id | null} */
    this.id = null;
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.ubicacion = ubicacion;
    this.tipoDeColectivo = tipoDeColectivo;
    this.activo = true;
    this.keycloackId = keycloackId;
    this.redesSociales = redesSociales;
    /** @type {import("./denuncia.js").Denuncia[]} */
    this.denuncias = [];
  }

  /**
   * @param {{ colectivo?: Colectivo }} proyecto
   */
  cargarProyecto(proyecto) {
    proyecto.colectivo = this;
    this.proyectos.push(proyecto);
  }
}

export { UBICACION_VALIDA, TipoColectivo, Colectivo };
