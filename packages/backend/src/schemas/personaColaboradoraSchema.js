import mongoose from "mongoose";
import { PersonaColaboradora, TipoMedioDeContacto } from "../models/personaColaboradora.js";
import { TipoRedSocial } from "../models/redSocial.js";

export const personaColaboradoraSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      auto: true,
    },
    nombreFantasia: {
      type: String,
      required: true,
    },
    git: {
      type: String,
      required: true,
    },
    nombre: {
      type: String,
      required: false,
    },
    apellido: {
      type: String,
      required: false,
    },
    habilidades: {
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
    pronombres: {
      type: [String],
      required: false,
    },
    presentacion: {
      type: String,
      required: false,
    },
    contactos: {
      type: [
        {
          tipo: {
            type: String,
            enum: {
              values: Object.values(TipoMedioDeContacto),
            },
            required: true,
          },
          valor: {
            type: String,
            required: true,
          },
          _id: false,
        },
      ],
      select: false,
    },
    bloquearMensajeInterno: {
      type: Boolean,
      default: false,
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
    activo:{
      type: Boolean,
      required: false,
      default: true,
      select: false
    },
    createdAt: { type: Date, select: false },
    updatedAt: { type: Date, select: false },
    __v: { type: Number, select: false },
  },
  {
    timestamps: true,
    collection: "personasColaboradoras",
  },
);

personaColaboradoraSchema.loadClass(PersonaColaboradora);

export const PersonaColaboradoraModel = mongoose.model(
  "PersonaColaboradora",
  personaColaboradoraSchema,
);
