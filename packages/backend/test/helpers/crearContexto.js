import { ProyectoService } from "../../src/services/proyectoService.js";
import { ColectivoService } from "../../src/services/colectivoService.js";
import { HabilidadService } from "../../src/services/habilidadService.js";
import { ColaboracionService } from "../../src/services/colaboracionService.js";
import { PersonaColaboradoraService } from "../../src/services/personaColaboradoraService.js";
import { PerfilService } from "../../src/services/perfilService.js";
import { MensajeService } from "../../src/services/mensajeService.js";
import { BusquedaService } from "../../src/services/busquedaService.js";
import { LogroService } from "../../src/services/logroService.js";
import { DenunciaService } from "../../src/services/denunciaService.js";
import {
  FakeHabilidadRepository,
  FakeColectivoRepository,
  FakePersonaColaboradoraRepository,
  FakeProyectoRepository,
  FakeColaboracionRepository,
  FakeMensajeRepository,
  FakeTransporter,
} from "../fakes/fakeRepositories.js";

// Arma el mismo grafo de dependencias que container.js, pero con repositorios en memoria.
// Cada test crea su propio contexto, así no comparten estado.
export function crearContexto({ transporter = new FakeTransporter() } = {}) {
  const repos = {
    habilidad: new FakeHabilidadRepository(),
    colectivo: new FakeColectivoRepository(),
    personaColaboradora: new FakePersonaColaboradoraRepository(),
    proyecto: new FakeProyectoRepository(),
  };
  repos.colaboracion = new FakeColaboracionRepository({
    personaColaboradoraRepository: repos.personaColaboradora,
    proyectoRepository: repos.proyecto,
  });
  repos.mensaje = new FakeMensajeRepository({ colectivoRepository: repos.colectivo });

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
  const denunciaService = new DenunciaService({
    colectivoRepository: repos.colectivo,
    colaboracionRepository: repos.colaboracion,
  });

  return {
    repos,
    transporter,
    habilidadService,
    perfilService,
    colectivoService,
    personaColaboradoraService,
    proyectoService,
    busquedaService,
    colaboracionService,
    mensajeService,
    logroService,
    denunciaService,
  };
}

// Datos de ejemplo reutilizables
export const perfilDeEjemplo = (cambios = {}) => ({
  descripcion: "Desarrollo front",
  habilidadesRequeridas: ["desarrollo_web_react"],
  habilidadesOpcionales: ["testing_e_2_e"],
  horas: 5,
  tipoDeCompromiso: "mensual",
  modalidadDeColaboracion: "gratuita",
  ...cambios,
});

// Carga un escenario base: 2 habilidades, 1 colectivo y 1 proyecto que requiere React
export async function cargarEscenarioBase(ctx) {
  const react = await ctx.habilidadService.crearHabilidad(
    "Desarrollo Web React",
    "Front con React",
  );
  const testing = await ctx.habilidadService.crearHabilidad("Testing E2E", "Cypress");
  const colectivo = await ctx.colectivoService.crearColectivo(
    "Fundación Ejemplo",
    "Una fundación",
    "caba",
    "fundacion",
  );
  const proyecto = await ctx.proyectoService.crearProyecto(
    "Web institucional",
    "Sitio de la fundación",
    [perfilDeEjemplo()],
    "Fundación Ejemplo",
    "https://fundacion.org",
  );
  return { react, testing, colectivo, proyecto };
}

// Verifica que una promesa falle con un AppError del catálogo
export async function expectAppError(promesa, error, statusCode) {
  await expect(promesa).rejects.toMatchObject({ code: error.code, statusCode });
}
