const colaboracionSchema = new mongoose.Schema({
    nombre:{
        type: String,
        required: true
    },
    descripcion:{
        type: String,
        required: true
    },
    ubicacion:{
        type: Enumerator,
        required: true
    },
    tipoDeColectivo:{
        type: Proyecto,
        required: true
    },
    proyectos:{
        type: Proyecto,
        required: true
    }
},{
    timestamps: true,
    collection: 'colaboraciones'
});

colaboracionSchema.loadClass(Colaboracion);

export const colaboracionModel = mongoose.model('Colaboracion', colaboracionSchema)

// this.nombre = nombre;
// this.descripcion = descripcion;
// this.ubicacion = ubicacion;
// this.tipoDeColectivo = tipoDeColectivo;
// this.proyectos = [];