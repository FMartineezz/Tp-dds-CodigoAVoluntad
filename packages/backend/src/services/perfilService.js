import { Perfil } from "../models/perfil.js";

export class PerfilService {
  constructor({ habilidadService }) {
    this.habilidadService = habilidadService;
  }

  async crearPerfil(
    descipcion,
    habilidadesRequeridas,
    habilidadesOpcionales,
    horas,
    tipoDeCompromiso,
    modalidadDeColaboracion,
  ) {
    const habilidadesEncontradasR = await Promise.all(
      habilidadesRequeridas.map((codigo => {
        return this.habilidadService.obtenerHabilidadPorCodigo(codigo)
      }))
    );

    const habilidadesEncontradasO = await Promise.all(
      habilidadesOpcionales.map((codigo => {
        return this.habilidadService.obtenerHabilidadPorCodigo(codigo)
      }))
    );

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
