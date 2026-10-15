import mongoose from "mongoose";
import { Habilidad } from "../models/habilidad.js";

export const habilidadSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      auto: true,
    },
    titulo: {
      type: String,
      required: true,
    },
    codigo: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    descripcion:{
        type: String,
        required: true
    },
    createdAt: { type: Date, select: false },
    updatedAt: { type: Date, select: false },
    __v: { type: Number, select: false }
},{
    timestamps: true,
    collection: "habilidades",
  },
);

habilidadSchema.loadClass(Habilidad);

export const HabilidadModel = mongoose.model("Habilidad", habilidadSchema);
