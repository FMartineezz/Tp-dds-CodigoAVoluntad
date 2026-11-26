/**
 * TEST DE INTEGRACIÓN DEL FRONT: aceptar y rechazar una postulación (PostulacionesOrg).
 *
 * Qué se integra: la pantalla real + sus adaptadores reales (api/organizacion.js,
 * api/proyectos.js, api/habilidades.js) + el router. Se reemplazan dos cosas:
 *   · el cliente HTTP (api/cliente.js): en lugar de hablar con el backend, contesta con
 *     respuestas armadas igual que las del backend.
 *   · la sesión (useAuth): la real necesita Keycloak, acá la org ya está logueada.
 * Así se prueba que la pantalla pide lo que tiene que pedir, traduce bien las respuestas
 * y muestra el feedback.
 *
 * Cada test sigue la estructura preparación → ejecución → validación.
 */
import { fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PostulacionesOrg from './PostulacionesOrg.js';
import { api } from '../../api/cliente.js';

const COLECTIVO_ID = 'c00000000000000000000001';

vi.mock('../../api/cliente.js', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

// Sesión de la org dueña del proyecto, sin pasar por Keycloak
vi.mock('../../contexto', () => ({
  useAuth: () => ({ rol: 'org', id: 'c00000000000000000000001' }),
}));
const PROYECTO_ID = 'p00000000000000000000001';
const POSTULACION_ID = 'f00000000000000000000001';

// ───── Respuestas del backend (mismas formas que devuelve la API) ─────
const habilidades = [
  { _id: 'h1', titulo: 'Desarrollo Web React', codigo: 'desarrollo_web_react', descripcion: '' },
];

const proyecto = {
  _id: PROYECTO_ID,
  titulo: 'Plataforma de Donaciones',
  descripcion: 'Donaciones comunitarias',
  colectivo: COLECTIVO_ID,
  finalizado: false,
  busquedaCerrada: false,
  logros: [],
  perfiles: [
    {
      _id: 'perfil1',
      descripcion: 'Frontend',
      habilidadesRequeridas: ['h1'],
      habilidadesOpcionales: [],
      horas: 6,
      tipoDeCompromiso: 'semanal',
      modalidadDeColaboracion: 'gratuita',
    },
  ],
};

function postulacion(estado) {
  return {
    id: POSTULACION_ID,
    estado,
    proyecto: proyecto.titulo,
    proyectoId: PROYECTO_ID,
    perfil: 'Frontend',
    perfilId: 'perfil1',
    personaColaboradora: {
      id: 'a00000000000000000000005',
      nombreFantasia: 'FullstackFer',
      habilidades: [{ titulo: 'Desarrollo Web React' }],
    },
  };
}

// Simula el backend: contesta cada GET según la ruta pedida.
function backendConPostulaciones(obtenerPostulaciones) {
  api.get.mockImplementation(async (url) => {
    if (url === '/habilidades') return { data: habilidades };
    if (url === `/proyectos/${PROYECTO_ID}`) return { data: proyecto };
    if (url === `/colectivos/${COLECTIVO_ID}/postulaciones`) return { data: obtenerPostulaciones() };
    throw new Error(`GET inesperado: ${url}`);
  });
}

// Abre la pantalla como la organización dueña del proyecto.
function renderizarPantalla() {
  return render(
    <MemoryRouter initialEntries={[`/org/proyectos/${PROYECTO_ID}/postulaciones`]}>
      <Routes>
        <Route path="/org/proyectos/:id/postulaciones" element={<PostulacionesOrg />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('PostulacionesOrg: el colectivo resuelve postulaciones', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('aceptar una postulación pendiente la manda al backend y la mueve a «Aceptadas»', async () => {
    // Preparación: una postulación pendiente; después de aceptarla el backend la devuelve aceptada
    let estado = 'pendiente';
    backendConPostulaciones(() => [postulacion(estado)]);
    api.patch.mockImplementation(async () => {
      estado = 'aceptada';
      return { data: { ...postulacion('aceptada') } };
    });
    renderizarPantalla();

    // Ejecución: espera la carga y toca «Aceptar» en la fila de la persona
    const fila = (await screen.findByText('FullstackFer')).closest('tr');
    expect(screen.getByRole('tab', { name: 'Pendientes (1)' })).toBeInTheDocument();
    fireEvent.click(within(fila).getByRole('button', { name: 'Aceptar' }));

    // Validación: pegó al endpoint correcto, avisó y la lista se recargó con el nuevo estado
    expect(api.patch).toHaveBeenCalledWith(`/postulaciones/${POSTULACION_ID}`, {
      estado: 'aceptada',
    });
    expect(
      await screen.findByText('Aceptaste a FullstackFer. Ya es parte del equipo.')
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('tab', { name: 'Aceptadas (1)' })).toBeInTheDocument()
    );
    expect(screen.getByRole('tab', { name: 'Pendientes (0)' })).toBeInTheDocument();
  });

  test('si el backend rechaza la aceptación (cupo lleno) se muestra su mensaje de error', async () => {
    // Preparación: el PATCH falla como falla el backend cuando el perfil ya no tiene cupo
    backendConPostulaciones(() => [postulacion('pendiente')]);
    api.patch.mockRejectedValue({
      response: {
        status: 409,
        data: { code: 'ERR-EST-507', message: 'El perfil ya alcanzó su límite de colaboraciones' },
      },
    });
    renderizarPantalla();

    // Ejecución
    const fila = (await screen.findByText('FullstackFer')).closest('tr');
    fireEvent.click(within(fila).getByRole('button', { name: 'Aceptar' }));

    // Validación: el mensaje del backend llega a la pantalla y la postulación sigue pendiente
    expect(
      await screen.findByText('El perfil ya alcanzó su límite de colaboraciones')
    ).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Pendientes (1)' })).toBeInTheDocument();
  });

  test('rechazar pide confirmación antes de llamar al backend', async () => {
    // Preparación
    backendConPostulaciones(() => [postulacion('pendiente')]);
    api.patch.mockResolvedValue({ data: postulacion('rechazada') });
    renderizarPantalla();

    // Ejecución: toca «Rechazar» y confirma en el diálogo
    const fila = (await screen.findByText('FullstackFer')).closest('tr');
    fireEvent.click(within(fila).getByRole('button', { name: 'Rechazar' }));
    expect(api.patch).not.toHaveBeenCalled(); // todavía no: primero el diálogo
    fireEvent.click(await screen.findByRole('button', { name: /sí, rechazar/i }));

    // Validación
    expect(api.patch).toHaveBeenCalledWith(`/postulaciones/${POSTULACION_ID}`, {
      estado: 'rechazada',
    });
    expect(await screen.findByText('Postulación rechazada.')).toBeInTheDocument();
  });
});
