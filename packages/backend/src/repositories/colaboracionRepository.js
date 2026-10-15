import { ColaboracionModel } from "../schemas/colaboracionSchema.js";

export class ColaboracionRepository {
  constructor() {
    this.model = ColaboracionModel;
  }

  async guardar(colaboracion) {
    const nuevaColaboracion = new this.model(colaboracion);
    return await nuevaColaboracion.save();
  }

  async obtenerTodas() {
    return await this.model.find().populate("personaColaboradora").populate("proyecto").lean();
  }

  async obtenerPorId(id) {
    return await this.model
      .findById(id)
      .populate("personaColaboradora")
      .populate("proyecto")
      .lean();
  }

  //Estadisticas
  async contarTotalYAnonimas() {
    return await this.model.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          anonimas: { $sum: { $cond: ["$anonima", 1, 0] } },
        },
      },
      { $project: { _id: 0, total: 1, anonimas: 1 } },
    ]);
  }
}

/*   constructor() {
    this.colaboraciones = [];
    this.id = 1;
  }

  guardar(colaboracion) {
    colaboracion.id = this.id;
    this.id++;
    this.colaboraciones.push(colaboracion);

    return colaboracion;
  }

  obtenerTodas() {
    return this.colaboraciones;
  }

  obtenerPorId(id) {
    return this.colaboraciones.find((colaboracion) => colaboracion.id === id);
  } */
