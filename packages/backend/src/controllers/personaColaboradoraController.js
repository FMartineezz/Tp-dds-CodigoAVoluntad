import personaColaboradoraServiceDefault from "../services/PersonaColaboradoraService.js";

class PersonaColaboradoraController {
    constructor(personaColaboradoraService = personaColaboradoraServiceDefault) {
        this.personaColaboradoraService = personaColaboradoraService;
    }

    crearPersonaColaboradora = (req, res) => {
        const persona =
            this.personaColaboradoraService
                .crearPersonaColaboradora(
                    req.body.nombreFantasia,
                    req.body.git,
                    req.body.nombre,
                    req.body.apellido,
                    req.body.habilidades,
                    req.body.pronombres,
                    req.body.presentacion);

        res.status(201).json(persona);
    }

    obtenerPersonasColaboradoras = (req, res) => {
        const personas = this.personaColaboradoraService.obtenerPersonasColaboradoras();

        res.status(200).json(personas);
        }

    obtenerPersonaColaboradoraPorId = (req, res) => {
        const id = Number(req.params.id);

        const persona =this.personaColaboradoraService.obtenerPersonaColaboradoraPorId(id);

        res.status(200).json(persona);
    }
}

export default new PersonaColaboradoraController();