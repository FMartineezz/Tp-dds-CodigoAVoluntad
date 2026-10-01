import { ProyectoRepository } from "./repositories/proyectoRepository.js";
import { ColectivoRepository } from "./repositories/colectivoRepository.js";
import { HabilidadRespository } from "./repositories/habilidadRepository.js";
import { ColaboracionRepository } from "./repositories/colaboracionRepository.js";
import { PersonaColaboradoraRepository } from "./repositories/personaColaboradoraRepository.js";

import { ProyectoService } from "./services/proyectoService.js";
import { ColectivoService } from "./services/colectivoService.js";
import { HabilidadService } from "./services/habilidadService.js";
import { ColaboracionService } from "./services/colaboracionService.js";
import { PersonaColaboradoraService } from "./services/personaColaboradoraService.js";

import { ProyectoController } from "./controllers/proyectoController.js";
import { ColectivoController } from "./controllers/colectivoController.js";
import { HabilidadController } from "./controllers/habilidadController.js";
import { ColaboracionController } from "./controllers/colaboracionController.js";
import { PersonaColaboradoraController } from "./controllers/personaColaboradoraController.js";
import { HealthCheckController } from "./controllers/healthCheckController.js";

// Repositorios: no tienen dependencias.
const proyectoRepository = new ProyectoRepository();
const colectivoRepository = new ColectivoRepository();
const habilidadRepository = new HabilidadRespository();
const colaboracionRepository = new ColaboracionRepository();
const personaColaboradoraRepository = new PersonaColaboradoraRepository();

// Services: dependen de repositorios y de otros services ya creados.
const habilidadService = new HabilidadService({ repository: habilidadRepository });
const colectivoService = new ColectivoService({ repository: colectivoRepository });
const proyectoService = new ProyectoService({ proyectoRepository, habilidadService, colectivoService });
const personaColaboradoraService = new PersonaColaboradoraService({
    personaColaboradoraRepository,
    habilidadService,
});
const colaboracionService = new ColaboracionService({
    colaboracionRepository,
    personaColaboradoraService,
    proyectoService,
});

// Controllers: dependen de services.
export const proyectoController = new ProyectoController({ proyectoService });
export const colectivoController = new ColectivoController({ service: colectivoService });
export const habilidadController = new HabilidadController({ habilidadService });
export const colaboracionController = new ColaboracionController({ colaboracionService });
export const personaColaboradoraController = new PersonaColaboradoraController({ personaColaboradoraService });
export const healthCheckController = new HealthCheckController();
