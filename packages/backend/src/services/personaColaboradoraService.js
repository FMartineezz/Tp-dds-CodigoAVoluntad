import PersonaColaboradoraModel from "../models/personaColaboradora.js";
import { AppError } from "../errors/appError.js";
import ErrorCatalog from "../errors/errorCatalog.js";

export class PersonaColaboradoraService {

    constructor({ personaColaboradoraRepository, habilidadService }) {
        this.personaColaboradoraRepository =
            personaColaboradoraRepository;

        this.habilidadService = habilidadService;
    }

    crearPersonaColaboradora(
        nombreFantasia,
        git,
        nombre,
        apellido,
        habilidades,
        pronombres,
        presentacion) 
        {
        const habilidadesEncontradas =
            habilidades.map(codigo =>this.habilidadService.obtenerHabilidadPorCodigo(codigo));

        const personaColaboradora =
            new PersonaColaboradoraModel.PersonaColaboradora(
                nombreFantasia,
                git,
                nombre,
                apellido,
                habilidadesEncontradas,
                pronombres,
                presentacion
            );

        return this.personaColaboradoraRepository.guardar(personaColaboradora);
    }

    obtenerPersonasColaboradoras() {
        return this.personaColaboradoraRepository.obtenerTodas();
    }

    obtenerPersonaColaboradoraPorId(id) {
        const persona = this.personaColaboradoraRepository.obtenerPorId(id);

        if (!persona) {
            throw new AppError(ErrorCatalog.COLABORADORA_NO_ENCONTRADA,404, id);
        }

        return persona;
    }
}
