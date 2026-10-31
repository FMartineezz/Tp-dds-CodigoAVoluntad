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

  async eliminar(id) {
    const colaboradora = await this.model.findOneAndUpdate(
      { _id: id, activo: true },
      { $set: { 
        nombreFantasia: "UserEliminado",
        git: `github:UserEliminado${id}`,
        nombre: "Usuario",
        apellido: "Eliminado",
        pronombres: [],
        presentacion: "Presentacion Usuario Eliminado",
        contactos: [],
        activo: false } },
      { new: true }
    );

    if (colaboradora) {
      return { actualizado: true };
    }

    const existe = await this.model.findById(id);
    if (!existe) {
      return { actualizado: false, razon: 'NO_ENCONTRADO' };
    }

    return { actualizado: false, razon: 'YA_DADO_DE_BAJA' };
  }
}
