import mongoose from "mongoose";
import { Colaboracion } from "../models/colaboracion";

//datos embebidos o referencia?
//si la colaboradora cambia sus atributos(agrega mas habilidades por ejemplo) me interesa ver esos cambios o no? 

const colaboracionSchema = new mongoose.Schema({
    personaColaboradora:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PersonaColaboradora',
        required: true
    },
    proyecto:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Proyecto',
        required: true
    }
},{
    timestamps: true,
    collection: 'colaboraciones'
});

colaboracionSchema.loadClass(Colaboracion);

export const ColaboracionModel = mongoose.model('Colaboracion', colaboracionSchema)