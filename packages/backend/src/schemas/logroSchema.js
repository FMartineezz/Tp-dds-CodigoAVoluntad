import mongoose from "mongoose";
import { Logro } from "../models/logro.js";

// Subdocumento embebido en Proyecto (no tiene colección propia)
export const logroSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      auto: true,
    },
    descripcion: {
      type: String,
      required: true,
    },
    porcentaje: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    urlCodigoFuente: {
      type: String,
      required: true,
    },
    createdAt: { type: Date, select: false },
    updatedAt: { type: Date, select: false },
    __v: { type: Number, select: false }
  },
  {
    timestamps: true,
  },
);

logroSchema.loadClass(Logro);
