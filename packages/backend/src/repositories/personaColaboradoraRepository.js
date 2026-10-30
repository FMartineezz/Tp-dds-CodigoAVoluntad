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

  async obtenerPorIdConContactos(id) {
    return await this.model.findById(id).lean().select('+contactos');
  }

  async obtenerPorHabilidadId(habilidadesIds) {
    return await this.model.find({ habilidades: { $in: habilidadesIds } }).lean();
  }

  async actualizar(id, cambios) {
    return await this.model
      .findByIdAndUpdate(id, { $set: cambios }, { new: true, runValidators: true })
      .lean();
  }
}
