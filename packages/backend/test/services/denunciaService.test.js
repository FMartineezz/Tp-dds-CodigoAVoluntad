import ErrorCatalog from "../../src/errors/errorCatalog.js";
import { EstadoDenuncia } from "../../src/models/denuncia.js";
import { crearContexto, cargarEscenarioBase, expectAppError } from "../helpers/crearContexto.js";

describe("DenunciaService", () => {
  let ctx;
  let escenario;
  let ana;
  let colabActiva;
  let colabDadaDeBaja;

  beforeEach(async () => {
    ctx = crearContexto();
    escenario = await cargarEscenarioBase(ctx);

    ana = await ctx.personaColaboradoraService.crearPersonaColaboradora(
      "Ana",
      "github.com/ana",
      null,
      null,
      ["desarrollo_web_react"],
      null,
      "Hola",
      [{ tipo: "email", valor: "ana@mail.com" }],
    );

    // Colaboración activa
    colabActiva = await ctx.repos.colaboracion.guardar({
      personaColaboradora: ana.id,
      proyecto: escenario.proyecto.id,
      perfil: escenario.proyecto.perfiles[0]._id,
      anonima: false,
      activo: true,
    });

    // Colaboración dada de baja (pero que acredita participación previa)
    colabDadaDeBaja = await ctx.repos.colaboracion.guardar({
      personaColaboradora: ana.id,
      proyecto: escenario.proyecto.id,
      perfil: escenario.proyecto.perfiles[0]._id,
      anonima: true,
      activo: false,
      fechaBaja: new Date(),
      bajaPor: "persona",
    });
  });

  describe("crearDenuncia", () => {
    test("creación correcta desde una colaboración activa", async () => {
      const denuncia = await ctx.denunciaService.crearDenuncia(colabActiva.id, {
        descripcion: "Falta de respuesta y destrato reiterado en reuniones",
      });

      expect(denuncia).toMatchObject({
        descripcion: "Falta de respuesta y destrato reiterado en reuniones",
        colaboracionId: colabActiva.id,
        estado: EstadoDenuncia.PENDIENTE,
      });
      expect(denuncia.fecha).toBeInstanceOf(Date);
      expect(denuncia.id).toBeDefined();
    });

    test("creación correcta desde una colaboración dada de baja (participación previa)", async () => {
      const denuncia = await ctx.denunciaService.crearDenuncia(colabDadaDeBaja.id, {
        descripcion: "Incumplimiento de acuerdos luego de finalizar la participación",
      });

      expect(denuncia).toMatchObject({
        descripcion: "Incumplimiento de acuerdos luego de finalizar la participación",
        colaboracionId: colabDadaDeBaja.id,
        estado: EstadoDenuncia.PENDIENTE,
      });
    });

    test("el estado inicial siempre es PENDIENTE", async () => {
      const denuncia = await ctx.denunciaService.crearDenuncia(colabActiva.id, {
        descripcion: "Denuncia de prueba",
      });

      expect(denuncia.estado).toBe(EstadoDenuncia.PENDIENTE);
    });

    test("obtiene y vincula correctamente el colectivo a partir del proyecto", async () => {
      const denuncia = await ctx.denunciaService.crearDenuncia(colabActiva.id, {
        descripcion: "Comportamiento inadecuado",
      });

      const colectivoGuardado = ctx.repos.colectivo.buscar(escenario.colectivo.id);
      expect(colectivoGuardado.denuncias).toHaveLength(1);
      expect(colectivoGuardado.denuncias[0]).toMatchObject({
        _id: denuncia.id,
        descripcion: "Comportamiento inadecuado",
        colaboracionId: colabActiva.id,
      });
    });

    test("falla con 404 si la colaboración no existe", async () => {
      await expectAppError(
        ctx.denunciaService.crearDenuncia("000000000000000000000999", {
          descripcion: "Algo ocurrió",
        }),
        ErrorCatalog.COLABORACION_NO_ENCONTRADA,
        404,
      );
    });

    test("falla con 400 si la colaboración no acredita participación real", async () => {
      const colabInvalida = await ctx.repos.colaboracion.guardar({
        personaColaboradora: null,
        proyecto: escenario.proyecto.id,
        perfil: escenario.proyecto.perfiles[0]._id,
        activo: true,
      });

      await expectAppError(
        ctx.denunciaService.crearDenuncia(colabInvalida.id, {
          descripcion: "No acredita persona real",
        }),
        ErrorCatalog.DENUNCIA_COLABORACION_NO_ACREDITA_PARTICIPACION,
        400,
      );
    });

    test("falla con 400 si el proyecto no tiene colectivo asociado", async () => {
      const proyectoHuerfano = await ctx.repos.proyecto.guardar({
        titulo: "Proyecto sin colectivo",
        descripcion: "Sin org",
        perfiles: [],
        colectivo: null,
      });

      const colabSinColectivo = await ctx.repos.colaboracion.guardar({
        personaColaboradora: ana.id,
        proyecto: proyectoHuerfano.id,
        perfil: "perfil123",
        activo: true,
      });

      await expectAppError(
        ctx.denunciaService.crearDenuncia(colabSinColectivo.id, {
          descripcion: "Proyecto sin colectivo",
        }),
        ErrorCatalog.DENUNCIA_PROYECTO_SIN_COLECTIVO,
        400,
      );
    });

    test("falla con 409 ante denuncia duplicada para la misma colaboración", async () => {
      await ctx.denunciaService.crearDenuncia(colabActiva.id, {
        descripcion: "Primera denuncia",
      });

      await expectAppError(
        ctx.denunciaService.crearDenuncia(colabActiva.id, {
          descripcion: "Segunda denuncia por la misma colaboración",
        }),
        ErrorCatalog.DENUNCIA_DUPLICADA,
        409,
      );
    });

    test("falla con 400 si falta la descripción", async () => {
      await expectAppError(
        ctx.denunciaService.crearDenuncia(colabActiva.id, {
          descripcion: "",
        }),
        ErrorCatalog.DENUNCIA_DESCRIPCION_REQUERIDA,
        400,
      );

      await expectAppError(
        ctx.denunciaService.crearDenuncia(colabActiva.id, {}),
        ErrorCatalog.DENUNCIA_DESCRIPCION_REQUERIDA,
        400,
      );
    });
  });

  describe("gestión administrativa y privacidad", () => {
    test("las respuestas operativas y la denuncia no exponen la identidad de quien denuncia", async () => {
      const denuncia = await ctx.denunciaService.crearDenuncia(colabActiva.id, {
        descripcion: "Reporte con privacidad",
      });

      expect(denuncia).not.toHaveProperty("denunciante");
      expect(denuncia).not.toHaveProperty("personaId");
      expect(denuncia).not.toHaveProperty("personaColaboradora");
      expect(denuncia).not.toHaveProperty("email");
    });

    test("las consultas públicas y la creación de colectivos no exponen las denuncias embebidas", async () => {
      // Creación de colectivo no expone denuncias
      const nuevoCol = await ctx.colectivoService.crearColectivo(
        "Nuevo Colectivo",
        "Desc",
        "caba",
        "ong",
      );
      expect(nuevoCol).not.toHaveProperty("denuncias");

      await ctx.denunciaService.crearDenuncia(colabActiva.id, {
        descripcion: "Denuncia privada",
      });

      const colectivoPublico = await ctx.colectivoService.obtenerColectivoPorId(
        escenario.colectivo.id,
      );
      expect(colectivoPublico).not.toHaveProperty("denuncias");

      const listaColectivos = await ctx.colectivoService.obtenerColectivos();
      const colectivoEnLista = listaColectivos.find((c) => c._id === escenario.colectivo.id);
      expect(colectivoEnLista).not.toHaveProperty("denuncias");
    });

    test("la administración puede consultar todas las denuncias con datos de sus colectivos", async () => {
      await ctx.denunciaService.crearDenuncia(colabActiva.id, {
        descripcion: "Denuncia 1",
      });
      await ctx.denunciaService.crearDenuncia(colabDadaDeBaja.id, {
        descripcion: "Denuncia 2",
      });

      const denunciasAdmin = await ctx.denunciaService.obtenerDenunciasParaAdmin();
      expect(denunciasAdmin).toHaveLength(2);
      expect(denunciasAdmin[0]).toMatchObject({
        colectivoId: escenario.colectivo.id,
        colectivoNombre: "Fundación Ejemplo",
        estado: EstadoDenuncia.PENDIENTE,
      });
    });

    test("la administración puede consultar una denuncia puntual y recuperar la colaboración asociada para contactar", async () => {
      const creada = await ctx.denunciaService.crearDenuncia(colabActiva.id, {
        descripcion: "Denuncia para seguimiento",
      });

      const detalleAdmin = await ctx.denunciaService.obtenerDenunciaPorIdParaAdmin(creada.id);

      expect(detalleAdmin).toMatchObject({
        _id: creada.id,
        descripcion: "Denuncia para seguimiento",
        colectivoNombre: "Fundación Ejemplo",
      });
      expect(detalleAdmin.colaboracion).toBeDefined();
      expect(detalleAdmin.colaboracion.personaColaboradora.nombreFantasia).toBe("Ana");
      expect(detalleAdmin.colaboracion.personaColaboradora.contactos).toEqual([
        { tipo: "email", valor: "ana@mail.com" },
      ]);
    });

    test("falla con 404 al consultar una denuncia inexistente", async () => {
      await expectAppError(
        ctx.denunciaService.obtenerDenunciaPorIdParaAdmin("000000000000000000000999"),
        ErrorCatalog.DENUNCIA_NO_ENCONTRADA,
        404,
      );
    });

    test("la administración puede actualizar el estado a EN_REVISION, RESUELTA o DESCARTADA", async () => {
      const creada = await ctx.denunciaService.crearDenuncia(colabActiva.id, {
        descripcion: "Para revisar",
      });

      const enRevision = await ctx.denunciaService.actualizarEstadoDenuncia(
        creada.id,
        EstadoDenuncia.EN_REVISION,
      );
      expect(enRevision.estado).toBe(EstadoDenuncia.EN_REVISION);

      const resuelta = await ctx.denunciaService.actualizarEstadoDenuncia(
        creada.id,
        EstadoDenuncia.RESUELTA,
      );
      expect(resuelta.estado).toBe(EstadoDenuncia.RESUELTA);

      const descartada = await ctx.denunciaService.actualizarEstadoDenuncia(
        creada.id,
        EstadoDenuncia.DESCARTADA,
      );
      expect(descartada.estado).toBe(EstadoDenuncia.DESCARTADA);
    });

    test("no permite actualizar administrativamente a PENDIENTE ni estados desconocidos", async () => {
      const creada = await ctx.denunciaService.crearDenuncia(colabActiva.id, {
        descripcion: "Para validar estados",
      });

      await expectAppError(
        ctx.denunciaService.actualizarEstadoDenuncia(creada.id, EstadoDenuncia.PENDIENTE),
        ErrorCatalog.DENUNCIA_ESTADO_INVALIDO,
        400,
      );

      await expectAppError(
        ctx.denunciaService.actualizarEstadoDenuncia(creada.id, "estado_inexistente"),
        ErrorCatalog.DENUNCIA_ESTADO_INVALIDO,
        400,
      );
    });

    test("falla con 404 al intentar actualizar una denuncia inexistente", async () => {
      await expectAppError(
        ctx.denunciaService.actualizarEstadoDenuncia(
          "000000000000000000000999",
          EstadoDenuncia.RESUELTA,
        ),
        ErrorCatalog.DENUNCIA_NO_ENCONTRADA,
        404,
      );
    });
  });

  describe("persistencia embebida en Colectivo", () => {
    test("las denuncias se persisten dentro del array de denuncias del colectivo", async () => {
      await ctx.denunciaService.crearDenuncia(colabActiva.id, {
        descripcion: "Denuncia embebida 1",
      });
      await ctx.denunciaService.crearDenuncia(colabDadaDeBaja.id, {
        descripcion: "Denuncia embebida 2",
      });

      const colectivoInterno = ctx.repos.colectivo.buscar(escenario.colectivo.id);
      expect(colectivoInterno.denuncias).toHaveLength(2);
      expect(colectivoInterno.denuncias[0].descripcion).toBe("Denuncia embebida 1");
      expect(colectivoInterno.denuncias[1].descripcion).toBe("Denuncia embebida 2");
    });
  });
});
