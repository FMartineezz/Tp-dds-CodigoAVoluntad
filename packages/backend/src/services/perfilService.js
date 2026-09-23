//import proyectoServiceDefault from "../services/proyectoService.js";
import habilidadServiceDefault from "./habilidadService.js";
import { Perfil } from "../models/perfil.js";

class PerfilService {
  constructor({
    //proyectoService = proyectoServiceDefault,
    habilidadService = habilidadServiceDefault,
  } = {}) {
    //this.proyectoService = proyectoService;
    this.habilidadService = habilidadService;
  }

  crearPerfil(
    descipcion,
    habilidadesRequeridas,
    habilidadesOpcionales,
    horas,
    tipoDeCompromiso,
    modalidadDeColaboracion,
  ) {
    const habilidadesEncontradasR = habilidadesRequeridas.map((codigo) => {
      return this.habilidadService.obtenerHabilidadPorCodigo(codigo);
    });

    const habilidadesEncontradasO = habilidadesOpcionales.map((codigo) => {
      return this.habilidadService.obtenerHabilidadPorCodigo(codigo);
    });

    const perfil = new Perfil(
      descipcion,
      habilidadesEncontradasR,
      habilidadesEncontradasO,
      horas,
      tipoDeCompromiso,
      modalidadDeColaboracion,
    );

    return perfil;
  }
}

export default new PerfilService();
