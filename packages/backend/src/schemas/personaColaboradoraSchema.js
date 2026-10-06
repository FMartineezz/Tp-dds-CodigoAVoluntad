import mongoose from "mongoose";
import { PersonaColaboradora } from "../models/personaColaboradora";

const personaColaboradoraSchema = new mongoose.Schema({
    nombreFantasia:{
        type: String,
        required: true
    },
    git:{
        type: String,
        required: true
    },
    nombre:{
        type: String,
        required: false
    },
    apellido:{
        type: String,
        required: false
    },
    habilidades:{
        type: Array,
        required: true
    },
    pronombres:{
        type: Array,
        required: false
    },
    presentacion:{
        type: String,
        required: false
    }
},{
    timestamps: true,
    collection: 'colaboradoras'
});

personaColaboradoraSchema.loadClass(PersonaColaboradora);

export const personaColaboradoraModel = mongoose.model('Colaboradora', personaColaboradoraSchema)