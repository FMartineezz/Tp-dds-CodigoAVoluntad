/**
 * ENTRADA de la aplicación.
 * Orden: fuentes → estilos universales → render. (En CRA este archivo se llama index.js.)
 */
import '@fontsource-variable/archivo/wdth.css';  // eje de ancho: sin esto no hay letra condensada
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/ibm-plex-mono/600.css';
import './estilos/index.css';                    // paleta, títulos, espaciado… (todo el aspecto)
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.js';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
