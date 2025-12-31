
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carga las variables de entorno del sistema
  const env = loadEnv(mode, '.', '');
  
  return {
    plugins: [react()],
    base: './', 
    define: {
      // Definimos process.env.API_KEY para que el frontend pueda acceder a ella
      'process.env.API_KEY': JSON.stringify(env.API_KEY || '')
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
  };
});
