/**
 * Contenedor de dependencias: crea una sola instancia de cada repositorio, service y controller,
 * inyectando a cada uno lo que necesita por constructor. Las rutas importan de acá los controllers.
 */
import nodemailer from "nodemailer";
import { ProyectoRepository } from "./repositories/proyectoRepository.js";
import { ColectivoRepository } from "./repositories/colectivoRepository.js";
import { HabilidadRespository } from "./repositories/habilidadRepository.js";
import { ReporteRepository } from "./repositories/reporteRepository.js";
import { ColaboracionRepository } from "./repositories/colaboracionRepository.js";
import { PersonaColaboradoraRepository } from "./repositories/personaColaboradoraRepository.js";
import { MensajeRepository } from "./repositories/mensajesRepository.js";
import { ValoracionRepository } from "./repositories/valoracionRepository.js";
import { PostulacionRepository } from "./repositories/postulacionRepository.js";
import { NotificacionRepository } from "./repositories/notificacionRepository.js";

import { ProyectoService } from "./services/proyectoService.js";
import { ColectivoService } from "./services/colectivoService.js";
import { HabilidadService } from "./services/habilidadService.js";
import { ReporteService } from "./services/reporteService.js";
import { ColaboracionService } from "./services/colaboracionService.js";
import { PersonaColaboradoraService } from "./services/personaColaboradoraService.js";
import { PerfilService } from "./services/perfilService.js";
import { MensajeService } from "./services/mensajeService.js";
import { BusquedaService } from "./services/busquedaService.js";
import { EstadisticasService } from "./services/estadisticasService.js";
import { LogroService } from "./services/logroService.js";
import { ValoracionService } from "./services/valoracionService.js";
import { PostulacionService } from "./services/postulacionService.js";
import { DenunciaService } from "./services/denunciaService.js";
import { NotificacionAutomaticaService } from "./services/notificacionAutomaticaService.js";

import { ProyectoController } from "./controllers/proyectoController.js";
import { ColectivoController } from "./controllers/colectivoController.js";
import { HabilidadController } from "./controllers/habilidadController.js";
import { ReporteController } from "./controllers/reporteController.js";
import { ColaboracionController } from "./controllers/colaboracionController.js";
import { PersonaColaboradoraController } from "./controllers/personaColaboradoraController.js";
import { HealthCheckController } from "./controllers/healthCheckController.js";
import { PerfilController } from "./controllers/perfilController.js";
import { MensajeController } from "./controllers/mensajeController.js";
import { EstadisticasController } from "./controllers/estadisticasController.js";
import { LogroController } from "./controllers/logroController.js";
import { ValoracionController } from "./controllers/valoracionController.js";
import { PostulacionController } from "./controllers/postulacionController.js";
import { DenunciaController } from "./controllers/denunciaController.js";
import { NotificacionController } from "./controllers/notificacionController.js";

import { cierreProyectosJob } from "./cronTasks/cierreProyectoJob.js";

// Repositorios: no tienen dependencias.
const proyectoRepository = new ProyectoRepository();
const colectivoRepository = new ColectivoRepository();
const habilidadRepository = new HabilidadRespository();
const reporteRepository = new ReporteRepository();
const colaboracionRepository = new ColaboracionRepository();
const personaColaboradoraRepository = new PersonaColaboradoraRepository();
const mensajeRepository = new MensajeRepository();
const valoracionRepository = new ValoracionRepository();
const postulacionRepository = new PostulacionRepository();
const notificacionRepository = new NotificacionRepository();

// Transporter de mails para las notificaciones por medios externos.
// Sin SMTP configurado (por ejemplo, en desarrollo o en los tests) se usa el transporte JSON de
// nodemailer: arma el mail completo igual que el SMTP, pero no lo envía por la red.
const mailTransporter = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })
  : nodemailer.createTransport({ jsonTransport: true });

// Services: dependen de repositorios y de otros services ya creados.
const habilidadService = new HabilidadService({ repository: habilidadRepository });
const reporteService = new ReporteService({ reporteRepository });

const perfilService = new PerfilService({ habilidadService });

const colectivoService = new ColectivoService({ repository: colectivoRepository });

const personaColaboradoraService = new PersonaColaboradoraService({
  personaColaboradoraRepository,
  habilidadService,
});

const proyectoService = new ProyectoService({
  proyectoRepository,
  perfilService,
  colectivoService,
  habilidadService,
});

const busquedaService = new BusquedaService({ proyectoService, personaColaboradoraService });

const colaboracionService = new ColaboracionService({
  colaboracionRepository,
  personaColaboradoraService,
  proyectoService,
  colectivoRepository,
});

const mensajeService = new MensajeService({
  repository: mensajeRepository,
  colectivoService,
  personaColaboradoraService,
  transporter: mailTransporter,
  proyectoService,
});

const logroService = new LogroService({
  proyectoService,
  proyectoRepository,
});

const postulacionService = new PostulacionService({
  repository: postulacionRepository,
  personaColaboradoraService,
  proyectoService,
  colectivoService,
  colaboracionService,
});

const denunciaService = new DenunciaService({
  colectivoRepository,
  colaboracionRepository,
});

const valoracionService = new ValoracionService({
  valoracionRepository,
  colaboracionRepository,
  proyectoRepository,
  colectivoRepository,
  personaColaboradoraRepository,
});

const estadisticasService = new EstadisticasService({
  colaboracionService,
  colectivoService,
  proyectoService,
  personaColaboradoraService,
  postulacionService,
});

export const notificacionAutomaticaService = new NotificacionAutomaticaService({
  repository: notificacionRepository,
  personaColaboradoraService,
  colectivoService,
  busquedaService,
});

// Services exportados para poder probarlos contra la base real en los tests.
export {
  habilidadService,
  perfilService,
  colectivoService,
  personaColaboradoraService,
  proyectoService,
  busquedaService,
  colaboracionService,
  mensajeService,
  logroService,
  postulacionService,
  denunciaService,
  valoracionService,
  estadisticasService,
  mailTransporter,
};

// Controllers: dependen de services.
export const proyectoController = new ProyectoController({ proyectoService });
export const colectivoController = new ColectivoController({ service: colectivoService });
export const habilidadController = new HabilidadController({ habilidadService });
export const colaboracionController = new ColaboracionController({ colaboracionService });
export const personaColaboradoraController = new PersonaColaboradoraController({
  personaColaboradoraService,
  busquedaService,
});

export const logroController = new LogroController({ logroService });
export const healthCheckController = new HealthCheckController();
export const perfilController = new PerfilController({ proyectoService, busquedaService });
export const mensajeController = new MensajeController({ mensajeService });
export const estadisticasController = new EstadisticasController({ estadisticasService });
export const valoracionController = new ValoracionController({ valoracionService });
export const postulacionController = new PostulacionController({ postulacionService });
export const denunciaController = new DenunciaController({ denunciaService });
export const notificacionController = new NotificacionController({ notificacionAutomaticaService });
export const reporteController = new ReporteController({ reporteService });

//Job task
export const cierreProyectos = new cierreProyectosJob({ proyectoService });
