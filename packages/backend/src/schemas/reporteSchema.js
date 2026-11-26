import mongoose from "mongoose";
import { EstadoReporte, Reporte, TipoReporte } from "../models/reporte.js";

export const reporteSchema = new mongoose.Schema(
  {
    tipo: { type: String, enum: Object.values(TipoReporte), required: true },
    descripcion: { type: String, required: true },
    pantalla: { type: String, default: null },
    correo: { type: String, default: null },
    estado: {
      type: String,
      enum: Object.values(EstadoReporte),
      default: EstadoReporte.NUEVO,
    },
    fecha: { type: Date, required: true },
    __v: { type: Number, select: false },
  },
  { collection: "reportes" },
);

reporteSchema.loadClass(Reporte);

export const ReporteModel = mongoose.model("Reporte", reporteSchema);
