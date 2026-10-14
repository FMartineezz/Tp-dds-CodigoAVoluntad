import { PersonaColaboradoraModel } from "../schemas/personaColaboradoraSchema.js";

export class PersonaColaboradoraRepository {
  constructor() {
    this.model = PersonaColaboradoraModel;
  }

  async guardar(personaColaboradora) {
    const nuevaPersonaColaboradora = new this.model(personaColaboradora);
    return await nuevaPersonaColaboradora.save();
  }

  async obtenerTodas() {
    return await this.model.find().lean();
  }

  async obtenerPorId(id) {
    return await this.model.findById(id).lean();
  }

  async obtenerPodHabilidadId(habilidadesIds) {
    return await this.model.find({ habilidades: { $in: habilidadesIds } }).lean();
  }
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
  }

  obtenerPorAlgunaHabilidad(codigos) {
    return this.personasColaboradoras.filter((persona) =>
      persona.habilidades.some((habilidad) => codigos.includes(habilidad.codigo)),
    );
  }
  } */
