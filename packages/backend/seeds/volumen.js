// Genera datos en volumen (para paginación, búsquedas con muchos resultados y pruebas de UI)
// en el mismo formato que datos.js, así pasan por las mismas validaciones de sembrar.js.
//
// Es determinista: con la misma semilla genera siempre exactamente los mismos datos, así una
// captura o un bug encontrado con estos datos se puede reproducir.

import { Habilidad } from "../src/models/habilidad.js";
import { TipoColectivo, UBICACION_VALIDA } from "../src/models/colectivo.js";
import { TipoMedioDeContacto } from "../src/models/personaColaboradora.js";
import { TipoCompromiso, ModalidadColaboracion } from "../src/models/proyecto.js";
import { EstadoPostulacion } from "../src/models/postulacion.js";
import { OrigenBaja } from "../src/models/colaboracion.js";
import { TipoEvaluador } from "../src/models/valoracion.js";
import { EstadoDenuncia } from "../src/models/denuncia.js";
import { Emisor } from "../src/models/mensaje.js";
import { DestinatarioNotificacion } from "../src/models/notificacion.js";
import { TipoRedSocial } from "../src/models/redSocial.js";

export const CANTIDADES_POR_DEFECTO = { colectivos: 40, colaboradoras: 150, proyectos: 60 };

// Generador pseudoaleatorio mulberry32: chico, rápido y reproducible con una semilla
function crearAzar(semilla) {
  let estado = semilla >>> 0;
  const siguiente = () => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const entero = (min, max) => min + Math.floor(siguiente() * (max - min + 1));
  const elegir = (lista) => lista[Math.floor(siguiente() * lista.length)];
  const probabilidad = (p) => siguiente() < p;
  const mezclar = (lista) => {
    const copia = [...lista];
    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(siguiente() * (i + 1));
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
  };
  const algunos = (lista, min, max) => mezclar(lista).slice(0, entero(min, max));
  return { entero, elegir, probabilidad, mezclar, algunos };
}

const PREFIJOS = {
  [TipoColectivo.FUNDACION]: "Fundación",
  [TipoColectivo.ONG]: "ONG",
  [TipoColectivo.ASOCIACION_BARRIAL]: "Asociación Vecinal",
  [TipoColectivo.ASAMBLEA]: "Asamblea",
};
const NOMBRES_COLECTIVO = [
  "Raíces",
  "Manos Unidas",
  "Semillas del Sur",
  "Puentes",
  "Horizonte Común",
  "La Ronda",
  "Tierra Fértil",
  "Voces del Barrio",
  "Nuevo Amanecer",
  "El Ceibo",
  "Los Algarrobos",
  "Abrazo Solidario",
  "Ruta 40",
  "Andar Juntos",
  "Pan y Rosas",
];
const CAUSAS = [
  "educación popular",
  "cuidado del ambiente",
  "acceso a la vivienda",
  "soberanía alimentaria",
  "inclusión digital",
  "salud comunitaria",
  "deporte social",
  "cultura y arte barrial",
];
const ADJETIVOS = [
  "Curiosa",
  "Nocturno",
  "Veloz",
  "Paciente",
  "Rebelde",
  "Serena",
  "Inquieto",
  "Lunar",
  "Austral",
  "Binaria",
];
const ANIMALES = [
  "Carpincho",
  "Hornero",
  "Yaguareté",
  "Zorro",
  "Tero",
  "Cóndor",
  "Mulita",
  "Ñandú",
  "Puma",
  "Vizcacha",
];
const NOMBRES = ["Sofía", "Mateo", "Valentina", "Joaquín", "Camila", "Tomás", "Julieta", "Bruno"];
const APELLIDOS = ["Fernández", "López", "Martínez", "Sosa", "Romero", "Acosta", "Benítez", "Ríos"];
const PRONOMBRES = ["ella", "él", "elle", undefined];
const TIPOS_PROYECTO = ["Sistema de", "App de", "Portal de", "Mapa de", "Plataforma de"];
const TEMAS_PROYECTO = [
  "inscripciones",
  "voluntariado",
  "donaciones",
  "turnos",
  "inventario",
  "talleres",
  "relevamiento",
  "comunicación interna",
];

// Plantillas de perfiles: descripción, requeridas, opcionales (por título de habilidad)
const PLANTILLAS_PERFIL = [
  ["Frontend", ["Desarrollo Web React"], ["Programacion en JavaScript"]],
  ["Backend", ["Desarrollo con Node.js y Express"], ["Control de versiones con Git"]],
  [
    "Testing",
    ["Testing E2E con Cypress", "Pruebas de Integracion con Postman"],
    ["Uso de Soap UI"],
  ],
  ["Análisis de datos", ["Conocimientos de Pandas"], []],
  ["Documentación de API", ["Disenio y Documentacion de APIs con OpenAPI"], []],
];

// Cada proyecto rota por estos estados, así todos aparecen en cantidades parejas
const ESTADOS_PROYECTO = [
  "abierto",
  "abiertoConFecha",
  "fechaVencida",
  "busquedaCerrada",
  "finalizado",
  "cierreAutomatico",
];

const codigo = (titulo) => new Habilidad(titulo, "").codigo;

export function generarVolumen(habilidades, opciones = {}) {
  const { semilla = 2026, ...resto } = opciones;
  const cantidades = { ...CANTIDADES_POR_DEFECTO, ...resto };
  const azar = crearAzar(semilla);
  const codigos = habilidades.map(([titulo]) => codigo(titulo));
  const ubicaciones = [...UBICACION_VALIDA];
  const tipos = Object.values(TipoColectivo);

  // Colectivos
  const colectivos = [];
  for (let i = 0; i < cantidades.colectivos; i++) {
    const tipo = tipos[i % tipos.length];
    const nombre = `${PREFIJOS[tipo]} ${NOMBRES_COLECTIVO[i % NOMBRES_COLECTIVO.length]} ${i + 1}`;
    colectivos.push({
      nombre,
      descripcion: `Colectivo que trabaja por ${azar.elegir(CAUSAS)} en su comunidad.`,
      ubicacion: azar.elegir(ubicaciones),
      tipo,
      redesSociales: azar.probabilidad(0.5)
        ? [{ tipo: TipoRedSocial.INSTAGRAM, url: `https://instagram.com/colectivo${i + 1}` }]
        : [],
      eliminado: azar.probabilidad(0.08),
    });
  }

  // Personas colaboradoras
  const colaboradoras = [];
  for (let i = 0; i < cantidades.colaboradoras; i++) {
    const nombreFantasia = `${azar.elegir(ANIMALES)}${azar.elegir(ADJETIVOS)}${i + 1}`;
    const conNombre = azar.probabilidad(0.6);
    const contactos = [];
    if (azar.probabilidad(0.7)) {
      contactos.push({ tipo: TipoMedioDeContacto.EMAIL, valor: `colab${i + 1}@mail.com` });
    }
    if (azar.probabilidad(0.3)) {
      contactos.push({ tipo: TipoMedioDeContacto.WHATSAPP, valor: `11${50000000 + i}` });
    }
    colaboradoras.push({
      nombreFantasia,
      git: `https://github.com/${nombreFantasia.toLowerCase()}`,
      nombre: conNombre ? azar.elegir(NOMBRES) : undefined,
      apellido: conNombre && azar.probabilidad(0.7) ? azar.elegir(APELLIDOS) : undefined,
      habilidades: azar.algunos(codigos, 1, 4),
      pronombres: azar.elegir(PRONOMBRES),
      presentacion: azar.probabilidad(0.6)
        ? `Me interesa colaborar en proyectos de ${azar.elegir(CAUSAS)}.`
        : undefined,
      contactos,
      bloquearMensajeInterno: azar.probabilidad(0.1),
      redesSociales: azar.probabilidad(0.3)
        ? [{ tipo: TipoRedSocial.LINKEDIN, url: `https://linkedin.com/in/${nombreFantasia}` }]
        : [],
      eliminada: azar.probabilidad(0.04),
    });
  }

  // Proyectos
  const proyectos = [];
  for (let i = 0; i < cantidades.proyectos; i++) {
    const estado = ESTADOS_PROYECTO[i % ESTADOS_PROYECTO.length];
    const finalizado = estado === "finalizado" || estado === "cierreAutomatico";
    // Un colectivo dado de baja solo puede tener proyectos ya finalizados (historial)
    const posibles = finalizado ? colectivos : colectivos.filter((c) => !c.eliminado);
    const colectivo = posibles[i % posibles.length];
    const titulo = `${azar.elegir(TIPOS_PROYECTO)} ${azar.elegir(TEMAS_PROYECTO)} #${i + 1}`;

    const perfiles = azar.algunos(PLANTILLAS_PERFIL, 1, 3).map(([desc, req, opc]) => ({
      descripcion: desc,
      requeridas: req.map(codigo),
      opcionales: opc.map(codigo),
      horas: azar.entero(2, 40),
      compromiso: azar.elegir(Object.values(TipoCompromiso)),
      modalidad: azar.elegir(Object.values(ModalidadColaboracion)),
      cantidadMaxima: azar.probabilidad(0.6) ? azar.entero(1, 4) : undefined,
    }));

    const logros = [];
    let restante = finalizado ? 100 : azar.entero(0, 90);
    for (let n = 1; restante > 0 && n <= 4; n++) {
      const porcentaje =
        n === 4 || azar.probabilidad(0.3) ? restante : azar.entero(Math.min(5, restante), restante);
      logros.push([`Hito ${n}`, porcentaje, `https://github.com/proyecto-${i + 1}`]);
      restante -= porcentaje;
    }

    proyectos.push({
      titulo,
      descripcion: `Proyecto de ${colectivo.nombre} para mejorar la gestión de ${azar.elegir(TEMAS_PROYECTO)}.`,
      colectivo: colectivo.nombre,
      urlSistema: `https://proyecto-${i + 1}.codigoavoluntad.org`,
      urlDonaciones: azar.probabilidad(0.3) ? `https://cafecito.app/proyecto${i + 1}` : undefined,
      diasLimiteBusqueda: {
        abiertoConFecha: azar.entero(5, 60),
        fechaVencida: -azar.entero(1, 30),
      }[estado],
      diasCierre: estado === "cierreAutomatico" ? -azar.entero(1, 60) : undefined,
      busquedaCerrada: estado === "busquedaCerrada",
      finalizado,
      perfiles,
      logros,
      // Para el resto del generador (sembrar.js ignora las claves que no conoce)
      _abierto: estado === "abierto" || estado === "abiertoConFecha",
    });
  }

  // Postulaciones y, de las aceptadas, colaboraciones
  const postulaciones = [];
  const terminadas = [];
  const activas = [];
  for (const proyecto of proyectos) {
    const candidatas = azar.algunos(colaboradoras, 0, 16);
    for (const persona of candidatas) {
      // Una postulación por persona y proyecto, a un perfil que encaje con sus habilidades
      const perfil = proyecto.perfiles.find((p) =>
        p.requeridas.some((h) => persona.habilidades.includes(h)),
      );
      if (!perfil) continue;

      let estado = azar.elegir(
        proyecto._abierto
          ? [EstadoPostulacion.PENDIENTE, EstadoPostulacion.ACEPTADA, EstadoPostulacion.RECHAZADA]
          : [EstadoPostulacion.ACEPTADA, EstadoPostulacion.RECHAZADA],
      );
      // Una cuenta eliminada no deja postulaciones abiertas
      if (persona.eliminada && estado === EstadoPostulacion.PENDIENTE) {
        estado = EstadoPostulacion.RECHAZADA;
      }
      perfil._ocupados ??= 0;
      if (
        estado === EstadoPostulacion.ACEPTADA &&
        perfil._ocupados >= (perfil.cantidadMaxima ?? Infinity)
      ) {
        estado = EstadoPostulacion.RECHAZADA;
      }

      const postulacion = {
        colaboradora: persona.nombreFantasia,
        proyecto: proyecto.titulo,
        perfil: perfil.descripcion,
        estado,
        anonima: azar.probabilidad(0.2),
        diasResolucion: estado === EstadoPostulacion.PENDIENTE ? undefined : -azar.entero(1, 120),
      };

      if (estado === EstadoPostulacion.ACEPTADA) {
        if (azar.probabilidad(0.15)) {
          postulacion.baja = {
            por: azar.elegir(Object.values(OrigenBaja)),
            dias: -azar.entero(0, 30),
          };
        } else {
          perfil._ocupados++;
        }
        const colaboracion = { colaboradora: persona.nombreFantasia, proyecto: proyecto.titulo };
        (postulacion.baja || proyecto.finalizado ? terminadas : activas).push(colaboracion);
      }
      postulaciones.push(postulacion);
    }
  }

  // Valoraciones: solo sobre colaboraciones terminadas, a veces de un solo lado
  const valoraciones = [];
  for (const colaboracion of terminadas) {
    for (const evaluador of Object.values(TipoEvaluador)) {
      if (azar.probabilidad(0.6)) {
        valoraciones.push({
          ...colaboracion,
          evaluador,
          puntaje: azar.entero(1, 5),
          comentario: azar.probabilidad(0.7) ? "Comentario de la colaboración." : undefined,
        });
      }
    }
  }

  // Denuncias: algunas, en todos los estados
  const denuncias = [...terminadas, ...activas]
    .filter(() => azar.probabilidad(0.06))
    .map((colaboracion) => ({
      ...colaboracion,
      descripcion: "Denuncia generada para la demo.",
      estado: azar.elegir(Object.values(EstadoDenuncia)),
      dias: -azar.entero(0, 60),
    }));

  // Mensajes: el colectivo escribe por su proyecto; a veces la persona responde
  const porNombre = new Map(colaboradoras.map((c) => [c.nombreFantasia, c]));
  const mensajes = [];
  for (const postulacion of postulaciones) {
    const persona = porNombre.get(postulacion.colaboradora);
    if (persona.eliminada || persona.bloquearMensajeInterno || !azar.probabilidad(0.25)) continue;
    const proyecto = proyectos.find((p) => p.titulo === postulacion.proyecto);
    const base = {
      colectivo: proyecto.colectivo,
      colaboradora: persona.nombreFantasia,
      proyecto: proyecto.titulo,
    };
    const dias = -azar.entero(2, 90);
    mensajes.push({
      ...base,
      emisor: Emisor.COLECTIVO,
      texto: `Hola ${persona.nombreFantasia}, gracias por tu interés en "${proyecto.titulo}".`,
      dias,
      leido: azar.probabilidad(0.5),
    });
    if (azar.probabilidad(0.5)) {
      mensajes.push({
        ...base,
        emisor: Emisor.PERSONA,
        texto: "¡Gracias! Quedo atenta a novedades.",
        dias: dias + 1,
        leido: azar.probabilidad(0.5),
      });
    }
  }

  // Notificaciones automáticas: personas con habilidades acordes a proyectos abiertos
  const notificaciones = [];
  for (const proyecto of proyectos.filter((p) => p._abierto)) {
    const requeridas = proyecto.perfiles.flatMap((p) => p.requeridas);
    const acordes = colaboradoras.filter(
      (c) => !c.eliminada && c.habilidades.some((h) => requeridas.includes(h)),
    );
    for (const persona of azar.algunos(acordes, 0, 3)) {
      notificaciones.push({
        colaboradora: persona.nombreFantasia,
        proyecto: proyecto.titulo,
        destinatario: DestinatarioNotificacion.PERSONA,
        texto: `Hola ${persona.nombreFantasia}!, se publico el proyecto "${proyecto.titulo}" del colectivo ${proyecto.colectivo} que busca perfiles acordes a tus habilidades`,
      });
      if (azar.probabilidad(0.4)) {
        notificaciones.push({
          colaboradora: persona.nombreFantasia,
          proyecto: proyecto.titulo,
          destinatario: DestinatarioNotificacion.COLECTIVO,
          texto: `Hola ${proyecto.colectivo}!, hay una nueva persona colaboradora "${persona.nombreFantasia}" la cual tiene habilidades acordes al proyecto "${proyecto.titulo}"`,
        });
      }
    }
  }

  return {
    colectivos,
    colaboradoras,
    proyectos,
    postulaciones,
    valoraciones,
    denuncias,
    mensajes,
    notificaciones,
  };
}

// Suma la demo curada y el volumen generado en un solo juego de datos para sembrar()
export function conVolumen(datos, opciones) {
  const volumen = generarVolumen(datos.habilidades, opciones);
  const unir = (clave) => [...datos[clave], ...volumen[clave]];
  return {
    habilidades: datos.habilidades,
    colectivos: unir("colectivos"),
    colaboradoras: unir("colaboradoras"),
    proyectos: unir("proyectos"),
    postulaciones: unir("postulaciones"),
    valoraciones: unir("valoraciones"),
    denuncias: unir("denuncias"),
    mensajes: unir("mensajes"),
    notificaciones: unir("notificaciones"),
  };
}
