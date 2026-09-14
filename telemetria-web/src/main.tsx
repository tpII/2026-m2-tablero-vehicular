import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import Layout from './Layout';
import Home from './pages/Home';
import Telemetry from './pages/Telemetry';
import MQTTTest from './pages/MQTT-test';

// Definimos el árbol de rutas
const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "/", // Ruta por defecto (Inicio)
        element: <Home />,
      },
      {
        path: "/telemetry", // Ruta para la pestaña telemetry
        element: <Telemetry />,
      },
      {
        path: "/mqtt-test", // Ruta para la pestaña MQTT Test
        element: <MQTTTest />,
      }
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
