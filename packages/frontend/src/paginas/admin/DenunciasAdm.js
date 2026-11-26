/**
 * PANTALLA DenunciasAdm
 * Ruta: /admin/denuncias (opcional ?colectivo=<id> para ver las de un solo colectivo)
 * Quién la ve: Equipo administrativo
 * Qué muestra: Las denuncias a colectivos, en pestañas por estado. Cada fila lleva al
 *   detalle (/admin/denuncias/:id), donde se cambia el estado.
 * De dónde salen los datos: GET /admin/denuncias?colectivoId= (api/admin.js).
 * Para modificarla: COLUMNA NUEVA: <th> en <thead> + <td data-l="…"> por fila.
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   1. DATOS Y ESTADO: las denuncias (del backend), el colectivo del filtro y la pestaña.
 *      ESPERA Y ERRORES: cargando o aviso de error.
 *   2. CÁLCULOS: contadores por estado y la lista de la pestaña.
 *   3. ACCIONES: no hay (el detalle se abre con el enlace de cada fila).
 *   4. LO QUE SE DIBUJA: título, filtro activo, pestañas y tabla.
 */
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button, Heading, Text } from '../../atomos';
import { Tabs } from '../../moleculas';
import { usePedido } from '../../hooks';
import { ESTADOS_DE_DENUNCIA, fechaCorta, obtenerDenuncias } from '../../api/admin.js';
import { PantallaCargando, PantallaDeError } from './auxiliares.js';
import s from './Admin.module.css';
import sh from '../../plantillas/disposicion.module.css';

export default function DenunciasAdm() {
  // ───── 1. DATOS Y ESTADO ─────

  // ?colectivo=<id> en la dirección: lo pone el botón «Ver denuncias» de ColectivosAdm.
  const [parametros] = useSearchParams();
  const colectivoId = parametros.get('colectivo') ?? '';

  const { cargando, datos: denuncias, error } = usePedido(
    () => obtenerDenuncias({ colectivoId }),
    [colectivoId]
  );

  // Pestaña activa: un estado de ESTADOS_DE_DENUNCIA. Arranca en las que nadie miró.
  const [pestana, setPestana] = useState('pendiente');

  // ───── ESPERA Y ERRORES ─────
  if (cargando) return <PantallaCargando />;
  if (error) return <PantallaDeError titulo="No pudimos cargar las denuncias" error={error} />;

  // ───── 2. CÁLCULOS ─────

  // Una pestaña por estado, con cuántas hay entre paréntesis.
  const pestanas = Object.entries(ESTADOS_DE_DENUNCIA).map(([estado, texto]) => ({
    id: estado,
    label: `${texto} (${denuncias.filter((denuncia) => denuncia.estado === estado).length})`,
  }));
  const denunciasDeLaPestana = denuncias.filter((denuncia) => denuncia.estado === pestana);

  // Si se filtró por colectivo, su nombre sale de cualquiera de sus denuncias.
  const nombreDelColectivo = colectivoId && denuncias[0]?.colectivo;

  // ───── 4. LO QUE SE DIBUJA ─────
  return (
    <div className={`container ${sh.page}`}>
      <Heading level={1}>Denuncias</Heading>

      {/* BLOQUE: filtro activo — solo si se entró desde un colectivo */}
      {colectivoId && (
        <div className={`${sh.bar} ${sh.barInfo}`}>
          <span>Solo las denuncias a {nombreDelColectivo || 'este colectivo'}</span>
          <Button as={Link} to="/admin/denuncias" variant="secondary">Ver todas</Button>
        </div>
      )}

      {/* BLOQUE: pestañas por estado con la tabla adentro */}
      <Tabs tabs={pestanas} value={pestana} onChange={setPestana}>
        {denunciasDeLaPestana.length === 0 ? (
          <div className={sh.empty}>
            <Text>No hay denuncias en esta lista.</Text>
          </div>
        ) : (
          <table className={sh.table}>
            <thead>
              <tr><th>Fecha</th><th>Colectivo</th><th>Qué pasó</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {denunciasDeLaPestana.map((denuncia) => (
                <tr key={denuncia.id}>
                  <td data-l="Fecha">{fechaCorta(denuncia.fecha)}</td>
                  <td data-l="Colectivo">
                    <Link to={`/colectivos/${denuncia.colectivoId}`}>{denuncia.colectivo}</Link>
                  </td>
                  <td data-l="Qué pasó" className={s.celdaTexto}>
                    <span className={s.resumen}>{denuncia.descripcion}</span>
                  </td>
                  <td className={sh.actions}>
                    <Button as={Link} to={`/admin/denuncias/${denuncia.id}`} variant="secondary">
                      Revisar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Tabs>
    </div>
  );
}
