// Script semilla: carga las entidades iniciales directo en MongoDB con los modelos de Mongoose.
// Uso: npm run seed (desde packages/backend) o npm run seed:backend (desde la raíz).
//
// ATENCIÓN: antes de cargar BORRA todos los documentos de las colecciones que siembra,
// así el resultado es siempre el mismo. Usa la base configurada en el .env.
//
// No pasa por los services: los datos de abajo tienen que respetar a mano las reglas del dominio
// (habilidades existentes, ubicaciones válidas, logros que no superen 100%, etc.).

import "dotenv/config";
import mongoose from "mongoose";
import { MongoDBClient } from "../config/database.js";

import { HabilidadModel } from "../src/schemas/habilidadSchema.js";
import { ColectivoModel } from "../src/schemas/colectivoSchema.js";
import { PersonaColaboradoraModel } from "../src/schemas/personaColaboradoraSchema.js";
import { ProyectoModel } from "../src/schemas/proyectoSchema.js";
import { ColaboracionModel } from "../src/schemas/colaboracionSchema.js";
import { MensajeModel } from "../src/schemas/mensajeSchema.js";

import { Habilidad } from "../src/models/habilidad.js";
import { Colectivo, TipoColectivo } from "../src/models/colectivo.js";
import { PersonaColaboradora, TipoMedioDeContacto } from "../src/models/personaColaboradora.js";
import { Proyecto, TipoCompromiso, ModalidadColaboracion } from "../src/models/proyecto.js";
import { Perfil } from "../src/models/perfil.js";
import { Logro } from "../src/models/logro.js";
import { Colaboracion } from "../src/models/colaboracion.js";
import { Mensaje } from "../src/models/mensaje.js";

// =========================
// DATOS
// =========================

const habilidades = [
  [
    "Programacion en JavaScript",
    "Capacidad para desarrollar aplicaciones web y logica de negocio utilizando JS moderno.",
  ],
  ["Desarrollo con Node.js y Express", "Creacion de APIs RESTful, ruteo y manejo de middleware."],
  [
    "Control de versiones con Git",
    "Manejo de repositorios, ramas y flujo de trabajo colaborativo.",
  ],
  [
    "Disenio y Documentacion de APIs con OpenAPI",
    "Definicion de contratos de servicio RESTful, esquemas de datos y especificaciones OpenAPI/Swagger.",
  ],
  [
    "Pruebas de Integracion con Postman",
    "Disenio y ejecucion de colecciones de pruebas automatizadas para la verificacion de endpoints HTTP.",
  ],
  ["Desarrollo Web React", "Construccion de interfaces web con componentes de React."],
  ["Testing E2E con Cypress", "Automatizacion de pruebas de punta a punta sobre aplicaciones web."],
  ["Uso de Soap UI", "Pruebas funcionales de servicios SOAP y REST."],
  ["Conocimientos de Pandas", "Limpieza, transformacion y analisis de datos con Python y Pandas."],
];

const colectivos = [
  [
    "Colectivo Ambiental CABA",
    "Organizacion dedicada a promover el cuidado del medio ambiente y la sustentabilidad en la Ciudad de Buenos Aires.",
    "caba",
    TipoColectivo.FUNDACION,
  ],
  [
    "Red de Huertas de Palermo",
    "Colectivo de vecinos enfocado en la agricultura urbana, el compostaje comunitario y el intercambio de semillas.",
    "caba",
    TipoColectivo.ASOCIACION_BARRIAL,
  ],
  [
    "Asamblea Abierta por los Espacios Verdes",
    "Espacio horizontal de discusion y accion ciudadana para defender los parques publicos e impulsar proyectos ecologicos.",
    "caba",
    TipoColectivo.ASAMBLEA,
  ],
  [
    "Comedor Los Pibes",
    "ONG que sostiene un comedor comunitario y talleres de oficios para jovenes.",
    "cordoba",
    TipoColectivo.ONG,
  ],
];

// Las habilidades se indican por código (el título normalizado, como en la API)
const colaboradoras = [
  {
    nombreFantasia: "DevNeko",
    git: "https://github.com/devneko",
    nombre: "Lucía",
    apellido: "Gómez",
    habilidades: [
      "programacion_en_java_script",
      "desarrollo_web_react",
      "control_de_versiones_con_git",
    ],
    pronombres: "ella",
    presentacion:
      "Desarrolladora frontend apasionada por proyectos comunitarios y de código abierto.",
    contactos: [
      { tipo: TipoMedioDeContacto.EMAIL, valor: "devneko@mail.com" },
      { tipo: TipoMedioDeContacto.WHATSAPP, valor: "1127891234" },
    ],
  },
  {
    nombreFantasia: "BackendBeto",
    git: "https://gitlab.com/backendbeto",
    habilidades: [
      "desarrollo_con_node_js_y_express",
      "disenio_y_documentacion_de_ap_is_con_open_api",
    ],
    presentacion: "Backend developer. Prefiere no recibir mensajes internos.",
    contactos: [{ tipo: TipoMedioDeContacto.EMAIL, valor: "beto@mail.com" }],
    bloquearMensajeInterno: true,
  },
  {
    nombreFantasia: "QA Tincho",
    git: "https://github.com/qatincho",
    nombre: "Martín",
    habilidades: [
      "testing_e_2_e_con_cypress",
      "pruebas_de_integracion_con_postman",
      "uso_de_soap_ui",
    ],
    pronombres: "él",
    presentacion: "Tester con experiencia en automatización.",
    contactos: [{ tipo: TipoMedioDeContacto.SMS, valor: "1156781234" }],
  },
  {
    nombreFantasia: "DataSol",
    git: "https://github.com/datasol",
    habilidades: ["conocimientos_de_pandas"],
    presentacion: "Analista de datos. Me interesan proyectos con impacto social.",
  },
];

const perfil = (descripcion, requeridas, opcionales, horas, compromiso, modalidad) => ({
  descripcion,
  requeridas,
  opcionales,
  horas,
  compromiso,
  modalidad,
});

// Los logros de cada proyecto no pueden sumar más de 100
const proyectos = [
  {
    titulo: "Plataforma de Donaciones Comunitarias",
    descripcion: "App web para gestionar entregas de alimentos e insumos en el barrio.",
    colectivo: "Colectivo Ambiental CABA",
    urlSistema: "https://donaciones.colectivoambiental.org",
    perfiles: [
      perfil(
        "Desarrollo frontend",
        ["desarrollo_web_react"],
        ["control_de_versiones_con_git"],
        10,
        TipoCompromiso.SEMANAL,
        ModalidadColaboracion.GRATUITA,
      ),
      perfil(
        "Desarrollo backend",
        ["desarrollo_con_node_js_y_express"],
        ["disenio_y_documentacion_de_ap_is_con_open_api"],
        20,
        TipoCompromiso.MENSUAL,
        ModalidadColaboracion.INCENTIVO_ECONOMICO,
      ),
    ],
    logros: [
      [
        "Relevamiento de requerimientos con el colectivo",
        15,
        "https://github.com/colectivo-ambiental/donaciones",
      ],
      ["MVP con registro de donaciones", 30, "https://github.com/colectivo-ambiental/donaciones"],
    ],
  },
  {
    // Los perfiles del ejemplo del enunciado
    titulo: "Mapa de Huertas Urbanas",
    descripcion: "Mapa colaborativo de huertas comunitarias y su producción.",
    colectivo: "Red de Huertas de Palermo",
    urlSistema: "https://mapa.huertaspalermo.org",
    perfiles: [
      perfil(
        "Tester",
        ["testing_e_2_e_con_cypress"],
        ["uso_de_soap_ui"],
        5,
        TipoCompromiso.MENSUAL,
        ModalidadColaboracion.GRATUITA,
      ),
      perfil(
        "Analista de Datos",
        ["conocimientos_de_pandas"],
        ["programacion_en_java_script"],
        15,
        TipoCompromiso.MENSUAL,
        ModalidadColaboracion.INCENTIVO_ECONOMICO,
      ),
    ],
    logros: [],
  },
  {
    titulo: "Sitio de la Asamblea",
    descripcion: "Sitio institucional con agenda de actividades y petitorios.",
    colectivo: "Asamblea Abierta por los Espacios Verdes",
    urlSistema: "https://asambleaespaciosverdes.org",
    perfiles: [
      perfil(
        "Desarrollo web",
        ["programacion_en_java_script"],
        ["desarrollo_web_react"],
        40,
        TipoCompromiso.TOTAL,
        ModalidadColaboracion.CONTRATACION_EVENTUAL,
      ),
    ],
    logros: [
      ["Diseño y maquetado", 40, "https://github.com/asamblea-ev/sitio"],
      ["Agenda de actividades", 35, "https://github.com/asamblea-ev/sitio"],
      ["Publicación en producción", 25, "https://github.com/asamblea-ev/sitio"],
    ],
    // Finalizado: no aparece en las búsquedas y no acepta colaboraciones nuevas
    finalizado: true,
  },
];

const colaboraciones = [
  { colaboradora: "DevNeko", proyecto: "Plataforma de Donaciones Comunitarias", anonima: false },
  { colaboradora: "QA Tincho", proyecto: "Mapa de Huertas Urbanas", anonima: true },
  // Colaboración histórica en un proyecto que después se finalizó
  { colaboradora: "DevNeko", proyecto: "Sitio de la Asamblea", anonima: false },
];

const mensajes = [
  {
    colectivo: "Colectivo Ambiental CABA",
    colaboradora: "DevNeko",
    texto: "¡Hola! Vimos tu perfil y encaja con nuestro proyecto de donaciones.",
    diasAtras: 3,
  },
  {
    colectivo: "Red de Huertas de Palermo",
    colaboradora: "DataSol",
    texto: "Estamos buscando a alguien para analizar los datos de cosecha. ¿Te interesa?",
    diasAtras: 1,
  },
];

// =========================
// CARGA
// =========================

const porClave = (documentos, clave) => new Map(documentos.map((doc) => [doc[clave], doc]));

const idsDeHabilidades = (codigos, habilidadesPorCodigo) =>
  codigos.map((codigo) => {
    const habilidad = habilidadesPorCodigo.get(codigo);
    if (!habilidad) throw new Error(`El seed usa una habilidad que no existe: ${codigo}`);
    return habilidad._id;
  });

const hace = (dias) => new Date(Date.now() - dias * 24 * 60 * 60 * 1000);

async function limpiar() {
  for (const modelo of [
    MensajeModel,
    ColaboracionModel,
    ProyectoModel,
    PersonaColaboradoraModel,
    ColectivoModel,
    HabilidadModel,
  ]) {
    await modelo.deleteMany({});
  }
}

async function sembrar() {
  const habilidadesCreadas = await HabilidadModel.create(
    habilidades.map(([titulo, descripcion]) => new Habilidad(titulo, descripcion)),
  );
  const habilidadesPorCodigo = porClave(habilidadesCreadas, "codigo");

  const colectivosCreados = await ColectivoModel.create(
    colectivos.map(
      ([nombre, descripcion, ubicacion, tipo]) =>
        new Colectivo(nombre, descripcion, ubicacion, tipo),
    ),
  );
  const colectivosPorNombre = porClave(colectivosCreados, "nombre");

  const colaboradorasCreadas = await PersonaColaboradoraModel.create(
    colaboradoras.map(
      (c) =>
        new PersonaColaboradora(
          c.nombreFantasia,
          c.git,
          c.nombre,
          c.apellido,
          idsDeHabilidades(c.habilidades, habilidadesPorCodigo),
          c.pronombres,
          c.presentacion,
          c.contactos,
          c.bloquearMensajeInterno,
        ),
    ),
  );
  const colaboradorasPorNombre = porClave(colaboradorasCreadas, "nombreFantasia");

  const proyectosCreados = [];
  for (const datos of proyectos) {
    const colectivo = colectivosPorNombre.get(datos.colectivo);
    const perfiles = datos.perfiles.map(
      (p) =>
        new Perfil(
          p.descripcion,
          idsDeHabilidades(p.requeridas, habilidadesPorCodigo),
          idsDeHabilidades(p.opcionales, habilidadesPorCodigo),
          p.horas,
          p.compromiso,
          p.modalidad,
        ),
    );

    const totalLogros = datos.logros.reduce((total, [, porcentaje]) => total + porcentaje, 0);
    if (totalLogros > 100) throw new Error(`Los logros de "${datos.titulo}" suman ${totalLogros}%`);

    const proyecto = new Proyecto(
      datos.titulo,
      datos.descripcion,
      perfiles,
      colectivo._id,
      datos.urlSistema,
    );
    proyecto.logros = datos.logros.map(
      ([descripcion, porcentaje, url]) => new Logro(descripcion, porcentaje, url),
    );
    proyecto.finalizado = datos.finalizado ?? false;

    const creado = await ProyectoModel.create(proyecto);
    await ColectivoModel.updateOne({ _id: colectivo._id }, { $push: { proyectos: creado._id } });
    proyectosCreados.push(creado);
  }
  const proyectosPorTitulo = porClave(proyectosCreados, "titulo");

  const colaboracionesCreadas = await ColaboracionModel.create(
    colaboraciones.map(
      (c) =>
        new Colaboracion(
          colaboradorasPorNombre.get(c.colaboradora)._id,
          proyectosPorTitulo.get(c.proyecto)._id,
          c.anonima,
        ),
    ),
  );

  const mensajesCreados = await MensajeModel.create(
    mensajes.map((m) => {
      const mensaje = new Mensaje(
        colectivosPorNombre.get(m.colectivo)._id,
        colaboradorasPorNombre.get(m.colaboradora)._id,
        m.texto,
      );
      mensaje.date = hace(m.diasAtras);
      return mensaje;
    }),
  );

  return {
    habilidades: habilidadesCreadas.length,
    colectivos: colectivosCreados.length,
    colaboradoras: colaboradorasCreadas.length,
    proyectos: proyectosCreados.length,
    colaboraciones: colaboracionesCreadas.length,
    mensajes: mensajesCreados.length,
  };
}

async function main() {
  if (!process.env.MONGODB_URI || !process.env.MONGODB_DB_NAME) {
    console.error("Faltan MONGODB_URI o MONGODB_DB_NAME en el .env");
    process.exit(1);
  }

  await MongoDBClient.connect();
  console.log(`Limpiando y sembrando la base "${process.env.MONGODB_DB_NAME}"...`);

  try {
    await limpiar();
    const cantidades = await sembrar();
    console.table(cantidades);
    console.log("Seed terminado.");
  } catch (error) {
    console.error("Error en el seed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main();
