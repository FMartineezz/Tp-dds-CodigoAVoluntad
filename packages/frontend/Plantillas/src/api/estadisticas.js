/**
 * SERVICIO de estadísticas (GET /estadisticas).
 *
 * USO: const estadisticas = await obtenerEstadisticas();
 *   → { proyectos, activos, finalizados, colectivos, colaboradoras, colaboraciones,
 *       colectivosPorUbicacion: [[texto, cantidad]…], postulacionesPorProyecto: [[título, cantidad]…],
 *       crudo }   (crudo = la respuesta tal cual, para la página de la API pública)
 * OJO: el backend limita este endpoint a 5 pedidos cada 20 minutos por IP (si se pasa
 * responde 429). Por eso la respuesta se pide UNA vez y se guarda mientras la pestaña siga
 * abierta: Inicio e Info la comparten.
 */
import { api } from './cliente.js';
import { textoDeUbicacion } from './colectivos.js';

// Promesa guardada: el primer pedido la crea y los siguientes reutilizan la misma.
let guardadas = null;

export function obtenerEstadisticas() {
  if (!guardadas) {
    guardadas = api
      .get('/estadisticas')
      .then(({ data }) => aEstadisticasDeLaVista(data))
      .catch((error) => {
        // Si falló, se olvida para que el próximo intento vuelva a pedirlas.
        guardadas = null;
        throw error;
      });
  }
  return guardadas;
}

// ADAPTADOR: la respuesta anidada del backend → cifras sueltas y listas [etiqueta, valor]
// listas para el gráfico <Barras>.
function aEstadisticasDeLaVista(e) {
  const proyectos = e.estadisticasProyectos?.proyectos ?? {};
  return {
    proyectos: proyectos.total ?? 0,
    activos: proyectos.activos ?? 0,
    finalizados: proyectos.finalizados ?? 0,
    colectivos: e.estadisticasColectivos?.total ?? 0,
    colaboradoras: e.estadisticasPersonasColaboradoras?.total ?? 0,
    colaboraciones: e.estadisticasColaboraciones?.total ?? 0,
    colectivosPorUbicacion: (e.estadisticasColectivos?.porUbicacion ?? []).map((u) => [
      textoDeUbicacion(u.ubicacion),
      u.cantidad,
    ]),
    postulacionesPorProyecto: (e.estadisticasProyectos?.postulacionesPorProyecto ?? []).map((p) => [
      p.proyecto,
      p.cantidadPostulaciones,
    ]),
    crudo: e,
  };
}
