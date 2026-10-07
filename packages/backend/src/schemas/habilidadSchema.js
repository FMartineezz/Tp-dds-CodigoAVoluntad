import mongoose from "mongoose";
import { Habilidad } from "../models/habilidad";

export const habilidadSchema = new mongoose.Schema({
    titulo:{
        type: String,
        required: true
    },
    codigo:{
        type: String,
        required: true
    },
    descripcion:{
        type: String,
        required: true
    }
},{
    timestamps: true,
    collection: 'habilidades'
});

habilidadSchema.loadClass(Habilidad);

export const HabilidadModel = mongoose.model('Habilidad', habilidadSchema)