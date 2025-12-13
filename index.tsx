import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // USAR RUTA RELATIVA: ./sw.js
    // Esto es vital para evitar el error "The origin of the provided scriptURL..."
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('✅ Service Worker registrado con éxito:', reg.scope))
      .catch(err => console.error('❌ Error al registrar Service Worker:', err));
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);