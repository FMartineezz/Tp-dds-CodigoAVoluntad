import mongoose from "mongoose";
import { Postulacion } from "../models/postulacion.js";
import { EstadoPostulacion } from "../models/postulacion.js";

const postulacionSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      auto: true,
    },
    personaColaboradora: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PersonaColaboradora",
      required: true,
    },
    colectivo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Colectivo",
      required: true,
    },
    proyecto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Proyecto",
      required: true,
    },
    perfil: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    anonima: {
      type: Boolean,
      default: false,
    },
    estado: {
      type: String,
      enum: { values: Object.values(EstadoPostulacion) },
      default: EstadoPostulacion.PENDIENTE,
    },
    fechaResolucion: {
      type: Date,
      default: undefined,
      required: false,
    },
    createdAt: { type: Date, select: false },
    updatedAt: { type: Date, select: false },
    __v: { type: Number, select: false },
  },
  {
    timestamps: true,
    collection: "postulaciones",
  },
);

postulacionSchema.loadClass(Postulacion);

export const PostulacionModel = mongoose.model("Postulacion", postulacionSchema);
