import mongoose from "mongoose";
import { PersonaColaboradora, TipoMedioDeContacto } from "../models/personaColaboradora.js";
import { TipoRedSocial, esUrlValida } from "../models/redSocial.js";
import { fotoSchema } from "./fotoSchema.js";

// Mongoose corre el validador también con null, que acá significa «sin cargar»
const esUrlOVacio = (valor) => valor == null || esUrlValida(valor);

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
    // URL de una imagen publicada en otro lado (alternativa a subir la foto). Vacío = null.
    foto: {
      type: String,
      required: false,
      validate: { validator: esUrlOVacio, message: "La foto debe ser una URL válida" },
    },
    sitioWeb: {
      type: String,
      required: false,
      validate: { validator: esUrlOVacio, message: "El sitio web debe ser una URL válida" },
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
    // sparse: las cuentas sin Keycloak (seed, tests) no tienen id y no chocan entre sí
    keycloackId: {
      type: String,
      unique: true,
      sparse: true
    },
    activo:{
      type: Boolean,
      required: false,
      default: true,
      select: false
    },
    // Foto subida (los bytes). No se lee por defecto: solo la pide GET …/foto
    fotoArchivo: { type: fotoSchema, select: false },
    // Cuándo se subió la foto (null = no tiene). El front la usa para armar la URL de la imagen
    fotoSubida: { type: Date, default: null },
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
