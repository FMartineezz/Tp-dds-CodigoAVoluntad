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
    // const habilidadesEncontradasR = habilidadesRequeridas.map((codigo) => {
    //   return this.habilidadService.obtenerPorCodigo(codigo);
    // });
    const habilidadesEncontradasR = await this.habilidadService.obtenerHabilidadesPorCodigos(habilidadesRequeridas);

    // const habilidadesEncontradasO = habilidadesOpcionales.map((codigo) => {
    //   return this.habilidadService.obtenerPorCodigo(codigo);
    // });
    const habilidadesEncontradasO = await this.habilidadService.obtenerHabilidadesPorCodigos(habilidadesOpcionales);

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
