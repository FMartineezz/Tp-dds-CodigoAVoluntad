import { Perfil } from "../models/perfil.js";

export class PerfilService {
  constructor({ habilidadService }) {
    this.habilidadService = habilidadService;
  }

  crearPerfil(
    descripcion,
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
      descripcion,
      habilidadesEncontradasR,
      habilidadesEncontradasO,
      horas,
      tipoDeCompromiso,
      modalidadDeColaboracion,
    );

    return perfil;
  }
}
