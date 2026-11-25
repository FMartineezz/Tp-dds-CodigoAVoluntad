import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { basename } from 'node:path';

// Configuración de Vite para el front (npm run dev / build / test).
// Los archivos usan .js con JSX y CSS Modules, igual que Create React App.
export default defineConfig({
  // Rutas absolutas a /assets: con BrowserRouter, si se recarga /proyectos/123 una base
  // relativa ('./') buscaría los archivos en /proyectos/assets/… y la página quedaría en blanco.
  base: '/',
  plugins: [react({ include: /\.(js|jsx)$/ })],
  esbuild: { loader: 'jsx', include: /src\/.*\.jsx?$/, exclude: [] },
  css: {
    modules: {
      // Así en el navegador ves Button__primary y no _primary_h1zra_2; va sin hash porque no hay dos .module.css con el mismo nombre (ojo si agregás uno)
      generateScopedName: (clase, archivo) => `${basename(archivo, '.module.css')}__${clase}`,
    },
  },
  optimizeDeps: { esbuildOptions: { loader: { '.js': 'jsx' } } },
  test: { environment: 'jsdom', globals: true, setupFiles: './src/setupTests.js', css: false },
});
