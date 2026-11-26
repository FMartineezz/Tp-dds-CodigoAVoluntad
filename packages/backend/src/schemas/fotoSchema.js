import mongoose from "mongoose";

// Foto de perfil subida (la guardan colectivos y colaboradoras). Son los bytes de la imagen
// tal cual, ya achicada por el front (pesa unos pocos KB).
export const fotoSchema = new mongoose.Schema(
  {
    datos: { type: Buffer, required: true },
    // image/jpeg, image/png o image/webp: se devuelve tal cual en el GET
    tipo: { type: String, required: true },
  },
  { _id: false },
);
