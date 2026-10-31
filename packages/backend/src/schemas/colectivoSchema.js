import mongoose from "mongoose";
import { Colectivo, TipoColectivo, UBICACION_VALIDA } from "../models/colectivo.js";
import { TipoRedSocial } from "../models/redSocial.js";

const colectivoSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      auto: true,
    },
    nombre: {
      type: String,
      required: true,
    },
    descripcion: {
      type: String,
      required: true,
    },
    ubicacion: {
      type: String,
      enum: {
        values: Array.from(UBICACION_VALIDA),
      },
      required: true,
    },
    tipoDeColectivo: {
      type: String,
      enum: {
        values: Object.values(TipoColectivo),
      },
      required: true,
    },
    proyectos: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Proyecto",
        },
      ],
      required: true,
    },
    redesSociales: {
      type: [
        {
          tipo: {
            type: String,
            enum: {
              values: Object.values(TipoRedSocial),
            },
            required: true,
          },
          url: {
            type: String,
            required: true,
            validate: {
              validator: function (v) {
                if (typeof v !== "string" || !v.trim()) return false;
                try {
                  const parsed = new URL(v);
                  return parsed.protocol === "http:" || parsed.protocol === "https:";
                } catch {
                  return false;
                }
              },
              message: "La URL de la red social debe ser válida con protocolo HTTP o HTTPS",
            },
          },
          _id: false,
        },
      ],
      required: false,
      default: [],
      validate: {
        validator: function (redes) {
          if (!Array.isArray(redes)) return true;
          const tipos = redes.map((r) => (r.tipo?.toLowerCase ? r.tipo.toLowerCase() : r.tipo));
          return new Set(tipos).size === tipos.length;
        },
        message: "No se permiten tipos de redes sociales duplicados",
      },
    },
    activo: {
      type: Boolean,
      required: false,
      default: true,
      select: false,
    },
    createdAt: { type: Date, select: false },
    updatedAt: { type: Date, select: false },
    __v: { type: Number, select: false },
  },
  {
    timestamps: true,
    collection: "colectivos",
  },
);

colectivoSchema.loadClass(Colectivo);

export const ColectivoModel = mongoose.model("Colectivo", colectivoSchema);
