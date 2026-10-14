import mongoose from "mongoose";
import { Proyecto } from "../models/proyecto.js";
import { perfilSchema } from "./perfilSchema.js";

const proyectoSchema = new mongoose.Schema({
    _id: { 
        type: mongoose.Schema.Types.ObjectId, 
        auto: true 
    },
    titulo:{
        type: String,
        required: true
    },
    descripcion:{
        type: String,
        required: true
    },
    perfiles:{
        type: [perfilSchema],
        required: true
    },
    colectivo:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Colectivo',
        required: true
    },
    finalizado:{
        type: Boolean,
        required: true
    },
    createdAt: { type: Date, select: false },
    updatedAt: { type: Date, select: false },
    __v: { type: Number, select: false }
},{
    timestamps: true,
    collection: 'proyectos'
});

proyectoSchema.loadClass(Proyecto);

export const ProyectoModel = mongoose.model('Proyecto', proyectoSchema)