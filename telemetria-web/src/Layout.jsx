import { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import './Layout.css';

export default function Layout() {
  // Inicializamos el estado leyendo la memoria del navegador
  const [modoOscuro, setModoOscuro] = useState(() => {
    const temaGuardado = localStorage.getItem('temaOscuro');
    return temaGuardado === 'true';
  });

  // Cada vez que cambia el modo oscuro, lo guardamos
  useEffect(() => {
    localStorage.setItem('temaOscuro', modoOscuro);
  }, [modoOscuro]);

  const claseTema = modoOscuro ? 'tema-oscuro' : 'tema-claro';

  return (
    <div className={`app-container ${claseTema}`}>
      <nav style={{ display: 'flex', gap: '1rem', padding: '1rem', alignItems: 'center' }}>
        <NavLink to="/">Home</NavLink>
        <NavLink to="/telemetry">Telemetry</NavLink>
        <NavLink to="/mqtt-test">MQTT Test</NavLink>

        <button
          onClick={() => setModoOscuro(!modoOscuro)}
          style={{ marginLeft: 'auto', padding: '0.5rem', cursor: 'pointer' }}
        >
          {modoOscuro ? '☀️ Claro' : '🌙 Oscuro'}
        </button>
      </nav>

      <hr />

      <main style={{ padding: '1rem' }}>
        <Outlet />
      </main>
    </div>
  );
}
