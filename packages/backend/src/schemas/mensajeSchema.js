import mongoose from "mongoose";
import { Mensaje } from "../models/mensaje.js";
import { type } from "node:os";
import { Emisor } from "../models/mensaje.js";

export const mensajeSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      auto: true,
    },
    colectivo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Colectivo",
      required: true,
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
    emisor: {
      type: String,
      enum: { values: Object.values(Emisor) },
      required: true,
    },
    texto: {
      type: String,
      required: true,
    },
    leido: {
      type: Boolean,
      default: false,
    },
    date: {
      type: Date,
    },
    createdAt: { type: Date, select: false },
    updatedAt: { type: Date, select: false },
    __v: { type: Number, select: false },
  },
  {
    timestamps: true,
    collection: "mensajes",
  },
);

mensajeSchema.loadClass(Mensaje);

export const MensajeModel = mongoose.model("Mensaje", mensajeSchema);
