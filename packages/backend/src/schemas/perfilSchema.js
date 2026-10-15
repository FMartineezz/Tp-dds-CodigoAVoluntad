import mongoose from "mongoose";
import { Perfil } from "../models/perfil.js";
import { ModalidadColaboracion, TipoCompromiso } from "../models/proyecto.js";

export const perfilSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      auto: true,
    },
    descripcion: {
      type: String,
      required: true,
    },
    habilidadesRequeridas: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Habilidad",
        },
      ],
      required: true,
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
      },
    },
    habilidadesOpcionales: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Habilidad" }], default: [] },
    horas: {
      type: Number,
      required: false,
      min: 0,
    },
    tipoDeCompromiso: {
      type: String,
      enum: {
        values: Object.values(TipoCompromiso),
      },
      required: true,
    },
    modalidadDeColaboracion: {
      type: String,
      enum: {
        values: Object.values(ModalidadColaboracion),
      },
      required: false,
    },
    createdAt: { type: Date, select: false },
    updatedAt: { type: Date, select: false },
    __v: { type: Number, select: false }
  },
  {
    timestamps: true,
  },
);

perfilSchema.loadClass(Perfil);

