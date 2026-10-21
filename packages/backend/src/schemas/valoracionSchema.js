import mongoose from "mongoose";
import { Valoracion, TipoEvaluador } from "../models/valoracion.js";

const valoracionSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      auto: true,
    },
    colaboracion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Colaboracion",
      required: true,
    },
    evaluador: {
      type: String,
      enum: Object.values(TipoEvaluador),
      required: true,
    },
    puntaje: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: "El puntaje debe ser un número entero",
      },
    },
    comentario: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 500,
    },
    createdAt: { type: Date, select: false },
    updatedAt: { type: Date, select: false },
    __v: { type: Number, select: false },
  },
  {
    timestamps: true,
    collection: "valoraciones",
  },
);

valoracionSchema.index(
  { colaboracion: 1, evaluador: 1 },
  { unique: true },
);

valoracionSchema.loadClass(Valoracion);

export const ValoracionModel = mongoose.model(
  "Valoracion",
  valoracionSchema,
);
