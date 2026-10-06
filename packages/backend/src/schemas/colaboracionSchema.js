import mongoose from "mongoose";
import { Colaboracion } from "../models/colaboracion";
import { PersonaColaboradora } from "../models/personaColaboradora";
import { Proyecto } from "../models/proyecto";

const colaboracionSchema = new mongoose.Schema({
    personaColaboradora:{
        type: PersonaColaboradora,
        required: true
    },
    proyecto:{
        type: Proyecto,
        required: true
    }
},{
    timestamps: true,
    collection: 'colaboraciones'
});

colaboracionSchema.loadClass(Colaboracion);

export const colaboracionModel = mongoose.model('Colaboracion', colaboracionSchema)

// this.personaColaboradora = personaColaboradora;
// this.proyecto = proyecto;