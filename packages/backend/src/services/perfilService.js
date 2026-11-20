import { Perfil } from "../models/perfil.js";
import { AppError } from "../errors/appError.js";
import ErrorCatalog from "../errors/errorCatalog.js";

export class PerfilService {
  constructor({ habilidadService }) {
    this.habilidadService = habilidadService;
  }

  async crearPerfil(
    descripcion,
    habilidadesRequeridas,
    habilidadesOpcionales,
    horas,
    tipoDeCompromiso,
    modalidadDeColaboracion,
    cantidadMaxima,
  ) {
    const habilidades = [...habilidadesRequeridas, ...habilidadesOpcionales];
    const habilidadesEncontradas = await this.habilidadService.obtenerHabilidadesPorCodigos(habilidades);

    const mapaHabilidades = new Map(habilidadesEncontradas.map((habilidad) => [habilidad.codigo, habilidad]));

    const codigosNoEncontrados = habilidades.filter((codigo) => !mapaHabilidades.has(codigo));
    if (codigosNoEncontrados.length > 0) {
      throw new AppError(ErrorCatalog.HABILIDADES_INEXISTENTES_GENERICO, 400, codigosNoEncontrados);
    }

    const habilidadesEncontradasR = habilidadesRequeridas.map((codigo) => mapaHabilidades.get(codigo));
    const habilidadesEncontradasO = habilidadesOpcionales.map((codigo) => mapaHabilidades.get(codigo));

    const perfil = new Perfil(
      descripcion,
      habilidadesEncontradasR,
      habilidadesEncontradasO,
      horas,
      tipoDeCompromiso,
      modalidadDeColaboracion,
      cantidadMaxima,
    );

    return perfil;
  }

  async prepararCambios(cambios) {
    const cambiosPreparados = { ...cambios };

    const cambiaRequeridas = cambios.habilidadesRequeridas !== undefined;
    const cambiaOpcionales = cambios.habilidadesOpcionales !== undefined;

    // Si no se tocan las habilidades, se devuelven los cambios tal cual: poner listas vacías
    // acá borraría las habilidades que el perfil ya tiene.
    if (!cambiaRequeridas && !cambiaOpcionales) {
      return cambiosPreparados;
    }

    const reqs = cambios.habilidadesRequeridas || [];
    const opts = cambios.habilidadesOpcionales || [];

    const habilidades = [...reqs, ...opts];
    const habilidadesEncontradas = await this.habilidadService.obtenerHabilidadesPorCodigos(habilidades);

    const mapaHabilidades = new Map(habilidadesEncontradas.map((habilidad) => [habilidad.codigo, habilidad]));

    const codigosNoEncontrados = habilidades.filter((codigo) => !mapaHabilidades.has(codigo));
    if (codigosNoEncontrados.length > 0) {
      throw new AppError(ErrorCatalog.HABILIDADES_INEXISTENTES_GENERICO, 400, codigosNoEncontrados);
    }

    if (cambiaRequeridas) {
      cambiosPreparados.habilidadesRequeridas = reqs.map((codigo) => mapaHabilidades.get(codigo));
    }
    if (cambiaOpcionales) {
      cambiosPreparados.habilidadesOpcionales = opts.map((codigo) => mapaHabilidades.get(codigo));
    }

    return cambiosPreparados;
  }
}
