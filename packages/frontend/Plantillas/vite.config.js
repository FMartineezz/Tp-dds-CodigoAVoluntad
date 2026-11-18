import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuración SOLO para correr esta carpeta de plantillas por su cuenta (npm run dev).
// Los archivos usan .js con JSX y CSS Modules, igual que Create React App,
// por eso se pueden copiar tal cual a packages/frontend/src.
export default defineConfig({
  base: './',
  plugins: [react({ include: /\.(js|jsx)$/ })],
  esbuild: { loader: 'jsx', include: /src\/.*\.jsx?$/, exclude: [] },
  optimizeDeps: { esbuildOptions: { loader: { '.js': 'jsx' } } },
  test: { environment: 'jsdom', globals: true, setupFiles: './src/setupTests.js', css: false },
});
