import mongoose from "mongoose";
import { Colaboracion } from "../models/colaboracion.js";
import { OrigenBaja } from "../models/colaboracion.js";

const colaboracionSchema = new mongoose.Schema(
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
    activo: {
      type: Boolean,
      required: false,
      default: true
    },
    fechaBaja: {
      type: Date,
      default: undefined,
      required: false,
    },
    bajaPor: {
      type: String,
      enum: { values: Object.values(OrigenBaja) },
    },
    createdAt: { type: Date, select: false },
    updatedAt: { type: Date, select: false },
    __v: { type: Number, select: false },
  },
  {
    timestamps: true,
    collection: "colaboraciones",
  },
);

colaboracionSchema.loadClass(Colaboracion);

export const ColaboracionModel = mongoose.model("Colaboracion", colaboracionSchema);
