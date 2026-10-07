import { PersonaColaboradoraModel } from "../schemas/personaColaboradoraSchema.js";

export class PersonaColaboradoraRepository {
    constructor(){
      this.model = PersonaColaboradoraModel
    }
    
    async guardar(personaColaboradora) {
      const nuevaPersonaColaboradora = new this.model(personaColaboradora);
      return await nuevaPersonaColaboradora.save();
    }
    
    async obtenerTodas() {
      return await this.model.find();
    }
    
    async obtenerPorId(id) {
      return await this.model.findById(id);
    }

/*   constructor() {
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
    return this.personasColaboradoras.find((persona) => persona.id === id);
  } */
}
