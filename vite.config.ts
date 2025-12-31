
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // CRITICO: Esto asegura que Vite genere rutas relativas
  define: {
    // Inyectamos las variables de entorno para que estén disponibles en el cliente
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
    'process.env.CLAVE_API': JSON.stringify(process.env.CLAVE_API)
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      // Aseguramos que las dependencias se procesen correctamente
      external: []
    }
  },
  server: {
    port: 3000
  }
});
