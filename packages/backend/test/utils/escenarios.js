import mongoose from "mongoose";
import {
  habilidadService,
  colectivoService,
  personaColaboradoraService,
  proyectoService,
  postulacionService,
} from "../../src/container.js";
import { EstadoPostulacion } from "../../src/models/postulacion.js";
import { ColaboracionModel } from "../../src/schemas/colaboracionSchema.js";
import { ColectivoModel } from "../../src/schemas/colectivoSchema.js";

// Helpers para armar datos de prueba usando SOLO los services reales contra la base de test.
// Cada nombre/título lleva un contador para que no choquen las validaciones de unicidad.

let contador = 0;
const unico = (prefijo) => `${prefijo} ${++contador}`;

export const idInexistente = () => new mongoose.Types.ObjectId().toString();

export async function crearHabilidad(titulo = unico("Habilidad")) {
  return await habilidadService.crearHabilidad(titulo, `Descripción de ${titulo}`);
}

export async function crearColectivo(nombre = unico("Colectivo")) {
  return await colectivoService.crearColectivo(nombre, "Un colectivo de prueba", "caba", "ong");
}

export async function crearColaboradora({
  habilidades = [],
  nombreFantasia = unico("Colaboradora"),
  nombre = "Ana",
  contactos = [],
  bloquearMensajeInterno = false,
} = {}) {
  return await personaColaboradoraService.crearPersonaColaboradora(
    nombreFantasia,
    `github.com/${nombreFantasia.replace(/\s/g, "")}`,
    nombre,
    "Pérez",
    habilidades,
    ["ella"],
    "Hola, quiero colaborar",
    contactos,
    bloquearMensajeInterno,
  );
}

// perfiles: [{ habilidadesRequeridas: [codigos], habilidadesOpcionales, cantidadMaxima, descripcion }]
export async function crearProyecto({
  colectivo,
  perfiles,
  titulo = unico("Proyecto"),
  fechaLimiteBusqueda,
  fechaCierre,
} = {}) {
  const perfilesCompletos = perfiles.map((perfil, i) => ({
    descripcion: perfil.descripcion ?? `Perfil ${i + 1}`,
    habilidadesRequeridas: perfil.habilidadesRequeridas,
    habilidadesOpcionales: perfil.habilidadesOpcionales ?? [],
    horas: 10,
    tipoDeCompromiso: "semanal",
    modalidadDeColaboracion: "gratuita",
    cantidadMaxima: perfil.cantidadMaxima,
  }));

  return await proyectoService.crearProyecto(
    titulo,
    "Descripción del proyecto",
    perfilesCompletos,
    colectivo.nombre,
    "https://sistema.test",
    fechaCierre,
    fechaLimiteBusqueda,
  );
}

// Escenario base: una habilidad, un colectivo con un proyecto de un perfil que la requiere
// y una colaboradora que la tiene.
export async function armarEscenario({
  cantidadMaxima,
  contactos = [],
  bloquearMensajeInterno = false,
  fechaLimiteBusqueda,
} = {}) {
  const habilidad = await crearHabilidad();
  const colectivo = await crearColectivo();
  const proyecto = await crearProyecto({
    colectivo,
    perfiles: [{ habilidadesRequeridas: [habilidad.codigo], cantidadMaxima }],
    fechaLimiteBusqueda,
  });
  const persona = await crearColaboradora({
    habilidades: [habilidad.codigo],
    contactos,
    bloquearMensajeInterno,
  });

  return {
    habilidad,
    colectivo,
    proyecto,
    perfil: proyecto.perfiles[0],
    persona,
    colectivoId: colectivo.id,
    proyectoId: proyecto.id,
    perfilId: proyecto.perfiles[0].id,
    personaId: persona.id,
  };
}

// Crea y acepta una postulación: deja una colaboración real creada por el flujo del sistema.
export async function crearColaboracion(
  escenario,
  { persona = escenario.persona, anonima = false } = {},
) {
  const postulacion = await postulacionService.crearPostulacion(
    escenario.proyectoId,
    escenario.perfilId,
    persona.id,
    anonima,
  );
  await postulacionService.actualizarEstado(postulacion.id, EstadoPostulacion.ACEPTADA);

  const colaboracion = await ColaboracionModel.findOne({
    personaColaboradora: persona.id,
    proyecto: escenario.proyectoId,
    perfil: escenario.perfilId,
  }).lean();

  return { postulacion, colaboracion, colaboracionId: colaboracion._id.toString() };
}

// Espera (con timers reales) a que la condición asíncrona se cumpla, o falla por timeout.
export async function esperarHasta(condicion, { timeout = 3000, intervalo = 25 } = {}) {
  const limite = Date.now() + timeout;
  for (;;) {
    const resultado = await condicion();
    if (resultado) return resultado;
    if (Date.now() > limite) throw new Error("Timeout esperando la condición");
    await new Promise((resolver) => setTimeout(resolver, intervalo));
  }
}

export const pausa = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

// Inserta una denuncia directamente en el colectivo con el modelo mongoose real (para preparar
// datos de las consultas administrativas sin depender del alta de denuncias).
export async function sembrarDenuncia(
  colectivoId,
  colaboracionId,
  { descripcion = "Denuncia", estado } = {},
) {
  const colectivo = await ColectivoModel.findById(colectivoId).select("+denuncias");
  colectivo.denuncias.push({ descripcion, colaboracionId, ...(estado && { estado }) });
  await colectivo.save();
  return colectivo.denuncias[colectivo.denuncias.length - 1]._id.toString();
}
