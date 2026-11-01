import { jest } from "@jest/globals";
import { buildApp } from "../../../src/app.js";

import { ProyectoService } from "../../../src/services/proyectoService.js";
import { ColectivoService } from "../../../src/services/colectivoService.js";
import { HabilidadService } from "../../../src/services/habilidadService.js";
import { ColaboracionService } from "../../../src/services/colaboracionService.js";
import { PersonaColaboradoraService } from "../../../src/services/personaColaboradoraService.js";
import { PerfilService } from "../../../src/services/perfilService.js";
import { MensajeService } from "../../../src/services/mensajeService.js";
import { BusquedaService } from "../../../src/services/busquedaService.js";
import { LogroService } from "../../../src/services/logroService.js";

import { ProyectoController } from "../../../src/controllers/proyectoController.js";
import { ColectivoController } from "../../../src/controllers/colectivoController.js";
import { HabilidadController } from "../../../src/controllers/habilidadController.js";
import { ColaboracionController } from "../../../src/controllers/colaboracionController.js";
import { PersonaColaboradoraController } from "../../../src/controllers/personaColaboradoraController.js";
import { HealthCheckController } from "../../../src/controllers/healthCheckController.js";
import { PerfilController } from "../../../src/controllers/perfilController.js";
import { MensajeController } from "../../../src/controllers/mensajeController.js";
import { LogroController } from "../../../src/controllers/logroController.js";

import habilidadRoutes from "../../../src/routes/habilidadRoutes.js";
import proyectoRoutes from "../../../src/routes/proyectoRoutes.js";
import colectivoRoutes from "../../../src/routes/colectivoRoutes.js";
import personaColaboradoraRoutes from "../../../src/routes/personaColaboradoraRoutes.js";
import colaboracionRoutes from "../../../src/routes/colaboracionRoutes.js";
import healthCheckRoutes from "../../../src/routes/healthCheckRoutes.js";
import perfilRoutes from "../../../src/routes/perfilRoutes.js";
import logroRoutes from "../../../src/routes/logroRoutes.js";

// Un MOC por repositorio, con los mismos métodos que el repositorio real de Mongo
const crearRepositoriosMock = () => ({
  habilidad: {
    guardar: jest.fn(),
    obtenerTodas: jest.fn(),
    obtenerPorId: jest.fn(),
    obtenerPorTitulo: jest.fn(),
    obtenerPorCodigo: jest.fn(),
    obtenerPorCodigos: jest.fn(),
  },
  colectivo: {
    guardar: jest.fn(),
    obtenerTodos: jest.fn(),
    obtenerPorId: jest.fn(),
    obtenerPorNombre: jest.fn(),
    agregarProyecto: jest.fn(),
  },
  personaColaboradora: {
    guardar: jest.fn(),
    obtenerTodas: jest.fn(),
    obtenerPorId: jest.fn(),
    obtenerPorIdConContactos: jest.fn(),
    obtenerPorHabilidadId: jest.fn(),
    eliminar: jest.fn(),
  },
  proyecto: {
    guardar: jest.fn(),
    obtenerTodos: jest.fn(),
    obtenerPorId: jest.fn(),
    obtenerPorTituloYColectivo: jest.fn(),
    guardarPerfil: jest.fn(),
    obtenerPerfilPorId: jest.fn(),
    actualizarPerfil: jest.fn(),
    eliminarPerfil: jest.fn(),
    finalizarProyecto: jest.fn(),
    obtenerPorAlgunaHabilidad: jest.fn(),
    guardarLogro: jest.fn(),
    obtenerLogros: jest.fn(),
    obtenerLogroPorId: jest.fn(),
    actualizarLogro: jest.fn(),
    eliminarLogro: jest.fn(),
  },
  colaboracion: {
    guardar: jest.fn(),
    obtenerTodas: jest.fn(),
    obtenerPorId: jest.fn(),
    contarActivasPorPerfil: jest.fn(),
    desactivar: jest.fn(),
  },
  mensaje: { guardar: jest.fn(), obtenerPorColaboradoraId: jest.fn() },
});

// Arma la app igual que index.js + container.js, pero con los repositorios moqueados:
// se prueba de verdad el camino rutas -> validaciones -> controllers -> services -> errorHandler,
// sin depender de que haya una base de datos levantada.
export function buildTestApp() {
  const repos = crearRepositoriosMock();
  const transporter = { sendMail: jest.fn().mockResolvedValue() };

  const habilidadService = new HabilidadService({ repository: repos.habilidad });
  const perfilService = new PerfilService({ habilidadService });
  const colectivoService = new ColectivoService({ repository: repos.colectivo });
  const personaColaboradoraService = new PersonaColaboradoraService({
    personaColaboradoraRepository: repos.personaColaboradora,
    habilidadService,
  });
  const proyectoService = new ProyectoService({
    proyectoRepository: repos.proyecto,
    perfilService,
    colectivoService,
  });
  const busquedaService = new BusquedaService({ proyectoService, personaColaboradoraService });
  const colaboracionService = new ColaboracionService({
    colaboracionRepository: repos.colaboracion,
    personaColaboradoraService,
    proyectoService,
  });
  const mensajeService = new MensajeService({
    repository: repos.mensaje,
    colectivoService,
    personaColaboradoraService,
    transporter,
  });
  const logroService = new LogroService({ proyectoService, proyectoRepository: repos.proyecto });

  const controllers = {
    proyectoController: new ProyectoController({ proyectoService }),
    colectivoController: new ColectivoController({ service: colectivoService }),
    habilidadController: new HabilidadController({ habilidadService }),
    colaboracionController: new ColaboracionController({ colaboracionService }),
    personaColaboradoraController: new PersonaColaboradoraController({
      personaColaboradoraService,
      busquedaService,
    }),
    logroController: new LogroController({ logroService }),
    healthCheckController: new HealthCheckController(),
    perfilController: new PerfilController({ proyectoService, busquedaService }),
    mensajeController: new MensajeController({ mensajeService }),
  };

  const app = buildApp([
    habilidadRoutes(controllers),
    proyectoRoutes(controllers),
    colectivoRoutes(controllers),
    personaColaboradoraRoutes(controllers),
    colaboracionRoutes(controllers),
    healthCheckRoutes(controllers),
    perfilRoutes(controllers),
    logroRoutes(controllers),
  ]);

  return { app, repos, transporter };
}
