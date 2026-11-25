import { z as zod } from "zod";
import { AppError } from "../../errors/appError.js";
import ErrorCatalog from "../../errors/errorCatalog.js";
import { EstadoDeProyecto, ModalidadColaboracion } from "../../models/proyecto.js";

/** Largo máximo de ?busqueda (alcanza y sobra para un título o un nombre). */
export const LARGO_MAXIMO_BUSQUEDA = 100;

// Un parámetro que viene vacío (?estado=) cuenta como que no vino: el filtro no se aplica
const vacioComoAusente = (valor) => (valor === "" ? undefined : valor);

// Si el parámetro viene repetido (?habilidad=a&habilidad=b) Express lo arma como array y
// zod lo rechaza con el mismo código que un valor inválido
const opcional = (schema) => zod.preprocess(vacioComoAusente, schema.optional());

const busqueda = opcional(
  zod
    .string({ invalid_type_error: "FILTRO_BUSQUEDA_INVALIDA" })
    .trim()
    .max(LARGO_MAXIMO_BUSQUEDA, "FILTRO_BUSQUEDA_INVALIDA"),
);

const habilidad = opcional(zod.string({ invalid_type_error: "FILTRO_HABILIDAD_INVALIDA" }));

const filtrosDeProyectosSchema = zod.object({
  busqueda,
  habilidad,
  estado: opcional(
    zod.enum(Object.values(EstadoDeProyecto), {
      errorMap: () => ({ message: "FILTRO_ESTADO_PROYECTO_INVALIDO" }),
    }),
  ),
  modalidad: opcional(
    zod.enum(Object.values(ModalidadColaboracion), {
      errorMap: () => ({ message: "FILTRO_MODALIDAD_INVALIDA" }),
    }),
  ),
});

const filtrosDeColaboradorasSchema = zod.object({
  busqueda,
  habilidad,
  // En la query todo llega como texto: "true" / "false" se pasan a booleano
  aceptaMensajes: opcional(
    zod
      .enum(["true", "false"], {
        errorMap: () => ({ message: "FILTRO_ACEPTA_MENSAJES_INVALIDO" }),
      })
      .transform((valor) => valor === "true"),
  ),
});

// Arma el middleware: valida la query con el schema y deja los filtros en req.filtros.
// Los que no vinieron quedan en undefined (el repositorio los ignora).
function validarQueryCon(schema) {
  return (req, res, next) => {
    const resultado = schema.safeParse(req.query);

    if (!resultado.success) {
      const codigo = resultado.error.issues[0].message;
      throw new AppError(ErrorCatalog[codigo], 400, LARGO_MAXIMO_BUSQUEDA);
    }

    req.filtros = resultado.data;
    next();
  };
}

/**
 * Valida los filtros opcionales de GET /proyectos (?busqueda, ?estado, ?modalidad, ?habilidad).
 * Sale con `req.filtros` cargado.
 * @throws {AppError} 400 FILTRO_* si alguno es inválido.
 */
export const validarFiltrosDeProyectos = validarQueryCon(filtrosDeProyectosSchema);

/**
 * Valida los filtros opcionales de GET /colaboradoras (?busqueda, ?habilidad, ?aceptaMensajes).
 * Sale con `req.filtros` cargado.
 * @throws {AppError} 400 FILTRO_* si alguno es inválido.
 */
export const validarFiltrosDeColaboradoras = validarQueryCon(filtrosDeColaboradorasSchema);
