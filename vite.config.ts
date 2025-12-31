
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', 
  define: {
    // Intentamos capturar la clave de varios nombres posibles (incluyendo el que tiene espacio)
    // y la estandarizamos como process.env.API_KEY para el frontend.
    'process.env.API_KEY': JSON.stringify(
      process.env.API_KEY || 
      process.env.CLAVE_API || 
      process.env['CLAVE API'] || 
      ''
    )
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      external: []
    }
  },
  server: {
    port: 3000
  }
});
