/**
 * SERVICIO de reportes de problemas (POST /reportes).
 *
 * USO: await enviarReporte({ tipo, descripcion, pantalla, correo });
 * Es público: no hace falta sesión. El backend limita a 5 reportes cada 20 minutos por IP.
 */
import { api, sinVacios } from './cliente.js';

// Tipos de reporte: valor que entiende el backend → texto que se ve.
export const TIPOS_DE_REPORTE = {
  error: 'Algo no funciona',
  sugerencia: 'Tengo una sugerencia',
  otro: 'Otra cosa',
};

export async function enviarReporte(reporte) {
  const { data } = await api.post('/reportes', sinVacios(reporte));
  return data;
}
