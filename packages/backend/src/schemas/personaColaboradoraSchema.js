import mongoose from "mongoose";
import { PersonaColaboradora } from "../models/personaColaboradora.js";

export const personaColaboradoraSchema = new mongoose.Schema({
    _id: { 
        type: mongoose.Schema.Types.ObjectId, 
        auto: true 
    },
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
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Habilidad'
        }],
        required: true,
        validate: {
            validator: function(v) {
                return Array.isArray(v) && v.length > 0;
            },
        }
    },
    pronombres:{
        type: [String],
        required: false
    },
    presentacion:{
        type: String,
        required: false
    }
},{
    timestamps: true,
    collection: 'personasColaboradoras'
});

personaColaboradoraSchema.loadClass(PersonaColaboradora);

export const PersonaColaboradoraModel = mongoose.model('PersonaColaboradora', personaColaboradoraSchema)