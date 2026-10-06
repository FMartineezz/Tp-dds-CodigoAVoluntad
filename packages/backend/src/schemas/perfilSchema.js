import mongoose from "mongoose";
import { Perfil } from "../models/perfil";


//se puede embeber????
const perfilSchema = new mongoose.Schema({
    descripcion:{
        type: String,
        required: true
    },
    habilidadesRequeridas:{
        type: Array,
        required: true
    },
    habilidadesOpcionales:{
        type: Array,
        required: true
    },
    horas:{
        type: Number,
        required: false
    },
    tipoDeCompromiso:{
        type: Array,
        required: true
    },
    modalidadDeColaboracion:{
        type: Array,
        required: false
    }
},{
    timestamps: true,
    collection: 'perfiles'
});

perfilSchema.loadClass(Perfil);

export const perfilModel = mongoose.model('Perfil', perfilSchema)



// this.id = null;
// this.descripcion = descripcion;
// this.habilidadesRequeridas = habilidadesRequeridas;
// this.habilidadesOpcionales = habilidadesOpcionales;
// this.horas = horas;
// this.tipoDeCompromiso = tipoDeCompromiso; // puede ser "semanales","mensuales" o "totales"
// this.modalidadDeColaboracion = modalidadDeColaboracion;