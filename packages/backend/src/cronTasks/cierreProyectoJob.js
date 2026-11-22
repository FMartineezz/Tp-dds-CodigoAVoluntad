import cron from "node-cron";

/* Job que cada minuto cierra los proyectos cuya fecha de cierre ya pasó. */
export class cierreProyectosJob {
  /**
   * @param {object} deps
   * @param {import("../services/proyectoService.js").ProyectoService} deps.proyectoService
   */
  constructor({ proyectoService }) {
    this.proyectoService = proyectoService;
  }

  /** Programa el cron ("* * * * *": cada minuto). */
  iniciar() {
    cron.schedule("* * * * *", async () => {
      console.log("Running every 1 minute");
      console.log(new Date());

      const fechaActual = new Date();

      await this.proyectoService.cerrarProyectosSi(fechaActual);
    });
  }
}
