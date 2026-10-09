import mongoose from "mongoose";
import { Colaboracion } from "../models/colaboracion.js";

//datos embebidos o referencia?
//si la colaboradora cambia sus atributos(agrega mas habilidades por ejemplo) me interesa ver esos cambios o no? 

const colaboracionSchema = new mongoose.Schema({
    _id: { 
        type: mongoose.Schema.Types.ObjectId, 
        auto: true 
    },
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
    // timestamps: {
    //   createdAt: { select: false },
    //   updatedAt: { select: false }
    // }
    timestamps: true,
    collection: 'colaboraciones'
});

colaboracionSchema.loadClass(Colaboracion);

export const ColaboracionModel = mongoose.model('Colaboracion', colaboracionSchema)