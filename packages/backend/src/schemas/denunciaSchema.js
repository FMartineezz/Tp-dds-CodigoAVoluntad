import mongoose from "mongoose";
import { Denuncia, EstadoDenuncia } from "../models/denuncia.js";

// Subdocumento embebido en Colectivo (no tiene colección propia)
export const denunciaSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      auto: true,
    },
    descripcion: {
      type: String,
      required: true,
    },
    fecha: {
      type: Date,
      default: Date.now,
      required: true,
    },
    estado: {
      type: String,
      enum: {
        values: Object.values(EstadoDenuncia),
      },
      default: EstadoDenuncia.PENDIENTE,
      required: true,
    },
    colaboracionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Colaboracion",
      required: true,
    },
    createdAt: { type: Date, select: false },
    updatedAt: { type: Date, select: false },
    __v: { type: Number, select: false },
  },
  {
    timestamps: true,
  },
);

denunciaSchema.loadClass(Denuncia);
