import mongoose from "mongoose";
import {
  busquedaService,
  colectivoService,
  habilidadService,
  personaColaboradoraService,
  proyectoService,
} from "../../src/container.js";
import ErrorCatalog from "../../src/errors/errorCatalog.js";
import { usarBaseDeDatos } from "../utils/db.js";
import { esperarAppError } from "../utils/esperarAppError.js";

usarBaseDeDatos();

const idInexistente = () => new mongoose.Types.ObjectId().toString();

const perfil = (habilidadesRequeridas, habilidadesOpcionales = [], descripcion = "Perfil") => ({
  descripcion,
  habilidadesRequeridas,
  habilidadesOpcionales,
  horas: 10,
  tipoDeCompromiso: "semanal",
  modalidadDeColaboracion: "gratuita",
});

const crearProyecto = (titulo, perfiles) =>
  proyectoService.crearProyecto(
    titulo,
    "Descripción",
    perfiles,
    "Asamblea Norte",
    "https://sistema.org",
  );

const crearPersona = (nombreFantasia, habilidades) =>
  personaColaboradoraService.crearPersonaColaboradora(
    nombreFantasia,
    `github:${nombreFantasia}`,
    undefined,
    undefined,
    habilidades,
    undefined,
    "Presentación",
    [],
    false,
  );

const nombres = (personas) => personas.map((p) => p.nombreFantasia).sort();
const titulos = (proyectos) => proyectos.map((p) => p.titulo).sort();

describe("BusquedaService", () => {
  beforeEach(async () => {
    await habilidadService.crearHabilidad("Node", "Backend");
    await habilidadService.crearHabilidad("React", "Frontend");
    await habilidadService.crearHabilidad("Python", "Datos");
    await habilidadService.crearHabilidad("Diseño", "UX/UI");
    await colectivoService.crearColectivo("Asamblea Norte", "Asamblea", "caba", "asamblea");
  });

  describe("obtenerPersonasColaboradorasAcordesAPerfil", () => {
    test("devuelve las personas con alguna habilidad requerida del perfil", async () => {
      // Preparación
      const proyecto = await crearProyecto("Web", [
        perfil(["node", "react"], ["diseno"], "Fullstack"),
        perfil(["python"], [], "Datos"),
      ]);
      await crearPersona("ada", ["node"]);
      await crearPersona("grace", ["react", "python"]);
      await crearPersona("guido", ["python"]);
      await crearPersona("disenadora", ["diseno"]);
      const fullstack = proyecto.perfiles[0];

      // Ejecución
      const personas = await busquedaService.obtenerPersonasColaboradorasAcordesAPerfil(
        proyecto.id,
        fullstack._id.toString(),
      );

      // Validación
      // "disenadora" solo tiene una habilidad opcional y "guido" solo la del otro perfil
      expect(nombres(personas)).toEqual(["ada", "grace"]);
    });

    test("devuelve una lista vacía si nadie tiene las habilidades requeridas", async () => {
      // Preparación
      const proyecto = await crearProyecto("Web", [perfil(["python"])]);
      await crearPersona("ada", ["node"]);

      // Ejecución
      const personas = await busquedaService.obtenerPersonasColaboradorasAcordesAPerfil(
        proyecto.id,
        proyecto.perfiles[0]._id.toString(),
      );

      // Validación
      expect(personas).toEqual([]);
    });

    test("falla con 404 si el proyecto no existe", async () => {
      // Ejecución y Validación
      await esperarAppError(
        busquedaService.obtenerPersonasColaboradorasAcordesAPerfil(
          idInexistente(),
          idInexistente(),
        ),
        ErrorCatalog.PROYECTO_NO_ENCONTRADO,
        404,
      );
    });

    test("falla con 404 si el perfil no pertenece al proyecto", async () => {
      // Preparación
      const proyecto = await crearProyecto("Web", [perfil(["node"])]);

      // Ejecución y Validación
      await esperarAppError(
        busquedaService.obtenerPersonasColaboradorasAcordesAPerfil(proyecto.id, idInexistente()),
        ErrorCatalog.PERFIL_NO_ENCONTRADO,
        404,
      );
    });
  });

  describe("obtenerPersonasColaboradorasAcordesAProyecto", () => {
    test("une las habilidades requeridas de todos los perfiles sin repetir personas", async () => {
      // Preparación
      const proyecto = await crearProyecto("Web", [perfil(["node"]), perfil(["node", "python"])]);
      await crearPersona("ada", ["node"]);
      await crearPersona("guido", ["python"]);
      await crearPersona("linus", ["node", "python"]);
      await crearPersona("dan", ["react"]);

      // Ejecución
      const personas = await busquedaService.obtenerPersonasColaboradorasAcordesAProyecto(proyecto);

      // Validación
      expect(nombres(personas)).toEqual(["ada", "guido", "linus"]);
    });
  });

  describe("obtenerProyectosAcordesALaPersonaColaboradora", () => {
    test("devuelve los proyectos con algún perfil que requiere sus habilidades, con el colectivo", async () => {
      // Preparación
      await crearProyecto("Backend", [perfil(["node"])]);
      await crearProyecto("Datos", [perfil(["react"]), perfil(["python"])]);
      await crearProyecto("Solo opcional", [perfil(["diseno"], ["node"])]);
      const persona = await crearPersona("linus", ["node", "python"]);

      // Ejecución
      const proyectos = await busquedaService.obtenerProyectosAcordesALaPersonaColaboradora(
        persona.id,
      );

      // Validación
      expect(titulos(proyectos)).toEqual(["Backend", "Datos"]);
      proyectos.forEach((proyecto) => expect(proyecto.colectivo.nombre).toBe("Asamblea Norte"));
    });

    test("no incluye proyectos finalizados", async () => {
      // Preparación
      const finalizado = await crearProyecto("Viejo", [perfil(["node"])]);
      await crearProyecto("Nuevo", [perfil(["node"])]);
      await proyectoService.finalizarProyecto(finalizado.id);
      const persona = await crearPersona("ada", ["node"]);

      // Ejecución
      const proyectos = await busquedaService.obtenerProyectosAcordesALaPersonaColaboradora(
        persona.id,
      );

      // Validación
      expect(titulos(proyectos)).toEqual(["Nuevo"]);
    });

    test("devuelve una lista vacía si ningún proyecto requiere sus habilidades", async () => {
      // Preparación
      await crearProyecto("Backend", [perfil(["node"])]);
      const persona = await crearPersona("dan", ["react"]);

      // Ejecución
      const proyectos = await busquedaService.obtenerProyectosAcordesALaPersonaColaboradora(
        persona.id,
      );

      // Validación
      expect(proyectos).toEqual([]);
    });

    test("falla con 404 si la persona no existe", async () => {
      // Ejecución y Validación
      await esperarAppError(
        busquedaService.obtenerProyectosAcordesALaPersonaColaboradora(idInexistente()),
        ErrorCatalog.COLABORADORA_NO_ENCONTRADA,
        404,
      );
    });
  });
});
