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
  },
  {
    timestamps: true,
  },
);

logroSchema.loadClass(Logro);
