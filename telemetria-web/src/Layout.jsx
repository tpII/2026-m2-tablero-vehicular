import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import './Layout.css';

export default function Layout() {
  const [modoOscuro, setModoOscuro] = useState(false);

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
        {/* Aquí se renderizarán las vistas dependiendo de la URL */}
        <Outlet />
      </main>
    </div>
  );
}
