import mongoose from "mongoose";
import { Colectivo, TipoColectivo, UBICACION_VALIDA } from "../models/colectivo.js";

const colectivoSchema = new mongoose.Schema({
    nombre:{
        type: String,
        required: true
    },
    descripcion:{
        type: String,
        required: true
    },
    ubicacion:{
        type: String,
        enum: {
            values: Object.values(UBICACION_VALIDA),
        },
        required: true
    },
    tipoDeColectivo:{
        type: String,
        enum: {
            values: Object.values(TipoColectivo),
        },
        required: true
    },
    proyectos:{
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Proyecto'
        }],
        required: true
    }
},{
    timestamps: true,
    collection: 'colectivos'
});

colectivoSchema.loadClass(Colectivo);

export const ColectivoModel = mongoose.model('Colectivo', colectivoSchema)