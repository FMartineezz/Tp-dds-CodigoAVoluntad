import mongoose from "mongoose";
import { DestinatarioNotificacion, Notificacion } from "../models/notificacion.js";

export const notificacionSchema = new mongoose.Schema(
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
    destinatario: {
      type: String,
      enum: { values: Object.values(DestinatarioNotificacion) },
      required: true,
    },
    texto: {
      type: String,
      required: true,
    },
    createdAt: { type: Date, select: true },
    updatedAt: { type: Date, select: false },
    __v: { type: Number, select: false },
  },
  {
    timestamps: true,
    collection: "notificaciones",
    versionKey: false,
  },
);

notificacionSchema.index(
  { proyecto: 1, personaColaboradora: 1, destinatario: 1 },
  { unique: true },
);

notificacionSchema.loadClass(Notificacion);

export const NotificacionModel = mongoose.model("notificacion", notificacionSchema);
