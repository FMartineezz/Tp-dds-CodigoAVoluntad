class PersonaColaboradoraRepository {

    constructor() {
        this.personasColaboradoras = [];
        this.id = 1;
    }

    guardar(personaColaboradora) {
        personaColaboradora.id = this.id;
        this.id++;
        this.personasColaboradoras.push(personaColaboradora);
        return personaColaboradora;
    }

    obtenerTodas() {
        return this.personasColaboradoras;
    }

    obtenerPorId(id) {
        return this.personasColaboradoras.find(persona => persona.id === id);
    }
}

export default new PersonaColaboradoraRepository();