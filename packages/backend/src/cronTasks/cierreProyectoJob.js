import cron from "node-cron";

export class cierreProyectosJob {
  constructor({ proyectoService }) {
    this.proyectoService = proyectoService;
  }

  iniciar() {
    cron.schedule("* * * * *", async () => {
      console.log("Running every 1 minutes");
      console.log(new Date());

      const fechaActual = new Date();

      await this.proyectoService.cerrarProyectosSi(fechaActual);
    });
  }
}
