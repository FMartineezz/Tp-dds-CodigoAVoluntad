import { Perfil } from "../models/perfil.js";

/** @typedef {import("../errors/appError.js").AppError} AppError */
/** @typedef {import("../types.js").HabilidadGuardada} HabilidadGuardada */

/**
 * Datos de un perfil tal como llegan en el body (habilidades por CÓDIGO).
 * @typedef {object} DatosDePerfil
 * @property {string} descripcion
 * @property {string[]} habilidadesRequeridas
 * @property {string[]} habilidadesOpcionales
 * @property {number} horas
 * @property {import("../models/proyecto.js").TipoCompromisoValor} tipoDeCompromiso
 * @property {import("../models/proyecto.js").ModalidadColaboracionValor} modalidadDeColaboracion
 * @property {number} [cantidadMaxima]
 */

/**
 * Cambios de un PATCH de perfil ya preparados: las habilidades pasan de códigos a documentos.
 * @typedef {Omit<Partial<DatosDePerfil>, "habilidadesRequeridas" | "habilidadesOpcionales"> & {
 *   habilidadesRequeridas?: HabilidadGuardada[],
 *   habilidadesOpcionales?: HabilidadGuardada[],
 * }} CambiosDePerfilPreparados
 */

/**
 * Arma los perfiles de un proyecto traduciendo los códigos de habilidad a las habilidades
 * guardadas.
 */
export class PerfilService {
  /**
   * @param {object} deps
   * @param {import("./habilidadService.js").HabilidadService} deps.habilidadService
   */
  constructor({ habilidadService }) {
    this.habilidadService = habilidadService;
  }

  /**
   * Arma UN perfil. Es un atajo de {@link PerfilService#crearPerfiles} para un solo perfil.
   *
   * @param {string} descripcion
   * @param {string[]} habilidadesRequeridas Códigos de habilidad (ej. "desarrollo_web_react").
   * @param {string[]} habilidadesOpcionales Códigos de habilidad.
   * @param {number} horas
   * @param {import("../models/proyecto.js").TipoCompromisoValor} tipoDeCompromiso
   * @param {import("../models/proyecto.js").ModalidadColaboracionValor} modalidadDeColaboracion
   * @param {number} [cantidadMaxima] Cupo del perfil; sin cupo si no se indica.
   * @returns {Promise<Perfil>}
   * @throws {AppError} 400 si algún código de habilidad no existe.
   */
  async crearPerfil(
    descripcion,
    habilidadesRequeridas,
    habilidadesOpcionales,
    horas,
    tipoDeCompromiso,
    modalidadDeColaboracion,
    cantidadMaxima,
  ) {
    const [perfil] = await this.crearPerfiles([
      {
        descripcion,
        habilidadesRequeridas,
        habilidadesOpcionales,
        horas,
        tipoDeCompromiso,
        modalidadDeColaboracion,
        cantidadMaxima,
      },
    ]);
    return perfil;
  }

  /**
   * Arma varios perfiles con UNA sola consulta a la base, sin importar cuántos perfiles ni
   * cuántas habilidades tengan (evita el problema N+1):
   *   1. junta los códigos de habilidad de todos los perfiles,
   *   2. los busca juntos con un único `find({ codigo: { $in } })`,
   *   3. arma cada perfil en memoria (paso sincrónico, sin más idas a la base).
   *
   * @param {DatosDePerfil[]} datosDePerfiles
   * @returns {Promise<Perfil[]>} En el mismo orden en que llegaron.
   * @throws {AppError} 400 si algún código de habilidad no existe.
   */
  async crearPerfiles(datosDePerfiles) {
    // habilidadesOpcionales es opcional en el body: sin ella, el perfil queda con lista vacía
    const normalizados = datosDePerfiles.map((datos) => ({
      ...datos,
      habilidadesOpcionales: datos.habilidadesOpcionales ?? [],
    }));
    const codigos = normalizados.flatMap((datos) => [
      ...datos.habilidadesRequeridas,
      ...datos.habilidadesOpcionales,
    ]);
    const mapaHabilidades = await this.habilidadService.obtenerMapaPorCodigos(codigos);

    return normalizados.map(
      (datos) =>
        new Perfil(
          datos.descripcion,
          datos.habilidadesRequeridas.map((codigo) => mapaHabilidades.get(codigo)),
          datos.habilidadesOpcionales.map((codigo) => mapaHabilidades.get(codigo)),
          datos.horas,
          datos.tipoDeCompromiso,
          datos.modalidadDeColaboracion,
          datos.cantidadMaxima,
        ),
    );
  }

  /**
   * Traduce los códigos de habilidad de un PATCH de perfil a las habilidades guardadas.
   * Solo toca las listas que vienen en `cambios`, con una sola consulta para las dos.
   *
   * @param {Partial<DatosDePerfil>} cambios
   * @returns {Promise<CambiosDePerfilPreparados>} Los cambios listos para el repositorio.
   * @throws {AppError} 400 si algún código de habilidad no existe.
   */
  async prepararCambios(cambios) {
    // Arranca con los códigos tal cual; abajo se reemplazan por las habilidades encontradas
    const cambiosPreparados = /** @type {CambiosDePerfilPreparados} */ (
      /** @type {unknown} */ ({ ...cambios })
    );

    const cambiaRequeridas = cambios.habilidadesRequeridas !== undefined;
    const cambiaOpcionales = cambios.habilidadesOpcionales !== undefined;

    // Si no se tocan las habilidades, se devuelven los cambios tal cual: poner listas vacías
    // acá borraría las habilidades que el perfil ya tiene.
    if (!cambiaRequeridas && !cambiaOpcionales) {
      return cambiosPreparados;
    }

    const reqs = cambios.habilidadesRequeridas || [];
    const opts = cambios.habilidadesOpcionales || [];

    const mapaHabilidades = await this.habilidadService.obtenerMapaPorCodigos([...reqs, ...opts]);

    if (cambiaRequeridas) {
      cambiosPreparados.habilidadesRequeridas = reqs.map((codigo) => mapaHabilidades.get(codigo));
    }
    if (cambiaOpcionales) {
      cambiosPreparados.habilidadesOpcionales = opts.map((codigo) => mapaHabilidades.get(codigo));
    }

    return cambiosPreparados;
  }
}
