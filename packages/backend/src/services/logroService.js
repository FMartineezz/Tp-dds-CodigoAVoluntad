import { Logro } from "../models/logro.js";

export class LogroService{
crearLogro(proyectoId, descripcion, porcentaje, urlCodigoFuente) {
  const proyecto = this.proyectoService.obtenerProyectoPorId(proyectoId);

  const logro = new Logro(
    descripcion,
    porcentaje,
    urlCodigoFuente,
  );

  proyecto.agregarLogro(logro);

  return this.logroRepository.guardar(logro, proyectoId);
}
}