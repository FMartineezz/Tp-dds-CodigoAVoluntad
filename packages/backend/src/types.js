/**
 * TIPOS COMPARTIDOS (solo JSDoc: este archivo no exporta código).
 *
 * JavaScript no tiene tipos; estas definiciones los "compensan": documentan qué recibe y
 * devuelve cada función, y el editor (VS Code) las usa para autocompletar.
 *
 * Cómo usarlos desde otro archivo: con un import de tipo dentro de un comentario JSDoc, por
 * ejemplo un typedef de Id que apunte a import("../types.js").Id, o un param de tipo
 * import("../types.js").Paginacion.
 *
 * Convención de nombres:
 *   - `Proyecto`, `Perfil`, … (clases de src/models): el objeto de dominio ANTES de guardarse.
 *   - `ProyectoGuardado`, `PerfilGuardado`, …: lo que devuelven los repositorios (documento
 *     de Mongo con `_id`, normalmente leído con `.lean()`).
 */

/**
 * Id de Mongo: llega como string en la URL y como ObjectId desde la base.
 * @typedef {string | import("mongoose").Types.ObjectId} Id
 */

/**
 * Documento guardado: las propiedades del modelo `T` más el `_id` y las fechas que agrega Mongo.
 * @template T
 * @typedef {Omit<T, "id"> & { _id: import("mongoose").Types.ObjectId, id?: string, createdAt?: Date, updatedAt?: Date }} Guardado
 */

/**
 * Parámetros de paginación ya validados (middleware validarPaginacion).
 * @typedef {object} Paginacion
 * @property {number} pagina Empieza en 1.
 * @property {number} limite Cantidad por página (máximo LIMITE_MAXIMO).
 */

/**
 * Página de resultados que devuelven los repositorios.
 * @template T
 * @typedef {object} Pagina
 * @property {T[]} resultados
 * @property {number} total Cantidad total, sin paginar.
 */

/**
 * Cuerpo de respuesta de los listados paginados (ver utils/paginacion.js).
 * @template T
 * @typedef {Pagina<T> & { pagina: number, limite: number, totalPaginas: number }} RespuestaPaginada
 */

/** @typedef {Guardado<import("./models/habilidad.js").Habilidad>} HabilidadGuardada */
/** @typedef {Guardado<import("./models/reporte.js").Reporte>} ReporteGuardado */
/** @typedef {Guardado<import("./models/colectivo.js").Colectivo>} ColectivoGuardado */
/** @typedef {Guardado<import("./models/personaColaboradora.js").PersonaColaboradora>} PersonaColaboradoraGuardada */
/** @typedef {Guardado<import("./models/perfil.js").Perfil>} PerfilGuardado */
/** @typedef {Guardado<import("./models/logro.js").Logro>} LogroGuardado */
/** @typedef {Guardado<import("./models/proyecto.js").Proyecto>} ProyectoGuardado */
/** @typedef {Guardado<import("./models/postulacion.js").Postulacion>} PostulacionGuardada */
/** @typedef {Guardado<import("./models/colaboracion.js").Colaboracion>} ColaboracionGuardada */
/** @typedef {Guardado<import("./models/mensaje.js").Mensaje>} MensajeGuardado */
/** @typedef {Guardado<import("./models/notificacion.js").Notificacion>} NotificacionGuardada */
/** @typedef {Guardado<import("./models/valoracion.js").Valoracion>} ValoracionGuardada */
/** @typedef {Guardado<import("./models/denuncia.js").Denuncia>} DenunciaGuardada */

/**
 * Request de Express con los parámetros de ruta (:id, :colectivoId…) como string.
 * @typedef {import("express").Request<Record<string, string>>} RequestConParams
 */

/**
 * Request que ya pasó por validarPaginacion: trae `paginacion` con pagina y limite.
 * @typedef {RequestConParams & { paginacion: Paginacion }} RequestPaginado
 */

export {};
