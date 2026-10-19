import { Outlet, NavLink } from 'react-router-dom';
import './Layout.css';

export default function Layout() {
  return (
    <div className="app-container">
      <nav className="header-nav">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/telemetry">Telemetry</NavLink>
        <NavLink to="/mqtt-test">MQTT Test</NavLink>
      </nav>

      <main style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <Outlet />
      </main>
    </div>
  );
}
