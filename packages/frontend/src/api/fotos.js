/**
 * SERVICIO de fotos de perfil subidas (colectivos y colaboradoras). Se guardan en MongoDB.
 *
 * USO:
 *   const fotoSubida = await subirFoto('colectivos', id, archivo);   // archivo = File del <input>
 *   await borrarFoto('colaboradoras', id);
 *   urlDeFotoSubida('colectivos', id, c.fotoSubida)  → URL para <Avatar foto=…>, o null
 * Antes de subirla se recorta cuadrada y se achica a 256×256 en JPG (pesa unos 20 KB), así
 * cualquier foto del celular entra en el límite de 300 KB del backend.
 */
import { api } from './cliente.js';

const LADO = 256;
const CALIDAD = 0.85;

// URL de la foto subida, o null si no tiene. `fotoSubida` es la fecha que manda el backend:
// va en ?v= para que, si cambia la foto, el navegador no muestre la vieja guardada.
export function urlDeFotoSubida(recurso, id, fotoSubida) {
  if (!fotoSubida || !id) return null;
  return `${import.meta.env.VITE_API_URL}/${recurso}/${id}/foto?v=${Date.parse(fotoSubida)}`;
}

// Abre la imagen elegida para poder dibujarla (falla si el navegador no la entiende).
function leerImagen(archivo) {
  return new Promise((resolver, rechazar) => {
    const url = URL.createObjectURL(archivo);
    const imagen = new Image();
    imagen.onload = () => {
      URL.revokeObjectURL(url);
      resolver(imagen);
    };
    imagen.onerror = () => {
      URL.revokeObjectURL(url);
      rechazar(new Error('No pudimos leer esa imagen. Probá con una foto JPG o PNG.'));
    };
    imagen.src = url;
  });
}

// Recorta el cuadrado del centro, lo achica a 256×256 y lo devuelve como JPG.
export async function achicarFoto(archivo) {
  const imagen = await leerImagen(archivo);
  const lado = Math.min(imagen.naturalWidth, imagen.naturalHeight);
  const x = (imagen.naturalWidth - lado) / 2;
  const y = (imagen.naturalHeight - lado) / 2;

  const lienzo = document.createElement('canvas');
  lienzo.width = LADO;
  lienzo.height = LADO;
  const dibujo = lienzo.getContext('2d');
  // Fondo blanco: un PNG transparente en JPG quedaría negro
  dibujo.fillStyle = '#fff';
  dibujo.fillRect(0, 0, LADO, LADO);
  dibujo.drawImage(imagen, x, y, lado, lado, 0, 0, LADO, LADO);

  return new Promise((resolver) => lienzo.toBlob(resolver, 'image/jpeg', CALIDAD));
}

// PUT /:recurso/:id/foto → achica la foto y la sube. Devuelve la URL nueva para mostrarla.
export async function subirFoto(recurso, id, archivo) {
  const foto = await achicarFoto(archivo);
  const { data } = await api.put(`/${recurso}/${id}/foto`, foto, {
    headers: { 'Content-Type': 'image/jpeg' },
  });
  return urlDeFotoSubida(recurso, id, data.fotoSubida);
}

// DELETE /:recurso/:id/foto
export async function borrarFoto(recurso, id) {
  await api.delete(`/${recurso}/${id}/foto`);
}
