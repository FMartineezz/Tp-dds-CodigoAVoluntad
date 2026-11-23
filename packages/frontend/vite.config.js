import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuración de Vite para el front (npm run dev / build / test).
// Los archivos usan .js con JSX y CSS Modules, igual que Create React App.
export default defineConfig({
  // Rutas absolutas a /assets: con BrowserRouter, si se recarga /proyectos/123 una base
  // relativa ('./') buscaría los archivos en /proyectos/assets/… y la página quedaría en blanco.
  base: '/',
  plugins: [react({ include: /\.(js|jsx)$/ })],
  esbuild: { loader: 'jsx', include: /src\/.*\.jsx?$/, exclude: [] },
  optimizeDeps: { esbuildOptions: { loader: { '.js': 'jsx' } } },
  test: { environment: 'jsdom', globals: true, setupFiles: './src/setupTests.js', css: false },
});
