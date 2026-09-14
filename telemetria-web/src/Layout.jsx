import { Outlet, NavLink } from 'react-router-dom';
import './Layout.css'; // Opcional, para estilos

export default function Layout() {
  return (
    <div>
      <nav style={{ display: 'flex', gap: '1rem', padding: '1rem' }}>
        <NavLink to="/">Home</NavLink>
        <NavLink to="/telemetry">Telemetry</NavLink>
        <NavLink to="/mqtt-test">MQTT Test</NavLink>
      </nav>

      <hr />

      <main style={{ padding: '1rem' }}>
        {/* Aquí se renderizará Home o Profile dependiendo de la URL */}
        <Outlet />
      </main>
    </div>
  );
}
