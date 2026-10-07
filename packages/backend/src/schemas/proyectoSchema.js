import mongoose from "mongoose";
import { Proyecto } from "../models/proyecto";
import { perfilSchema } from "../middlewares/validations/proyectoValidation";

const proyectoSchema = new mongoose.Schema({
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
    }
},{
    timestamps: true,
    collection: 'proyectos'
});

proyectoSchema.loadClass(Proyecto);

export const ProyectoModel = mongoose.model('Proyecto', proyectoSchema)