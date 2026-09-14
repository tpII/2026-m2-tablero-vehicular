import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  PieChart,
  Pie,
  Cell,
  Line,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

// Datos históricos falsos (simulando la ventana de tiempo que guardarás en un estado)
const mockHistoricalData = [
  { time: '10:00:00', potenciometro: 0, rpm: 800, consumo: 0.5 },
  { time: '10:00:01', potenciometro: 20, rpm: 1200, consumo: 1.2 },
  { time: '10:00:02', potenciometro: 50, rpm: 2500, consumo: 3.5 },
  { time: '10:00:03', potenciometro: 80, rpm: 3800, consumo: 5.8 },
  { time: '10:00:04', potenciometro: 100, rpm: 4500, consumo: 6.2 },
  { time: '10:00:05', potenciometro: 100, rpm: 4800, consumo: 6.5 },
  { time: '10:00:06', potenciometro: 60, rpm: 3500, consumo: 3.0 },
  { time: '10:00:07', potenciometro: 10, rpm: 1500, consumo: 1.0 },
  { time: '10:00:08', potenciometro: 0, rpm: 800, consumo: 0.5 },
];

// Datos instantáneos falsos (lo que te llegue en el último mensaje MQTT)
const liveData = {
  rpm: 4800,
  maxRpm: 6000,
  potenciometro: 100,
  consumoPico: 6.5,
  voltajeFuente: 12.1
};

export default function Telemetry() {
  // Configuración de colores para el velocímetro/gauge
  const rpmColor = liveData.rpm > 4500 ? '#ff4d4d' : '#00C49F';
  const gaugeData = [
    { name: 'RPM', value: liveData.rpm },
    { name: 'Restante', value: liveData.maxRpm - liveData.rpm }
  ];

  // Configuración para la barra del pedal
  const pedalData = [{ name: 'Pedal', value: liveData.potenciometro }];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Análisis de Telemetría</h2>
      </div>

      {/* Contenedor principal dividido en 2 columnas */}
      <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: '2rem' }}>

        {/* COLUMNA IZQUIERDA: Gráficos Históricos Sincronizados */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          {/* Gráfico 1: Acelerador vs RPM */}
          <div style={{ height: '300px', backgroundColor: '#2b2b2b', padding: '1rem', borderRadius: '8px' }}>
            <h4 style={{ color: '#f1f1f1', marginTop: 0, marginBottom: '1rem' }}>Respuesta del Motor</h4>
            <ResponsiveContainer width="100%" height="100%">
              {/* El syncId="telemetria" es la magia que sincroniza este gráfico con el de abajo */}
              <ComposedChart data={mockHistoricalData} syncId="telemetria">
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="time" stroke="#888" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" domain={[0, 100]} />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" domain={[0, 6000]} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', color: '#fff' }} />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="potenciometro" name="Acelerador (%)" fill="#8884d8" stroke="#8884d8" fillOpacity={0.2} />
                <Line yAxisId="right" type="monotone" dataKey="rpm" name="Motor (RPM)" stroke="#82ca9d" strokeWidth={3} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico 2: Consumo Energético */}
          <div style={{ height: '250px', backgroundColor: '#2b2b2b', padding: '1rem', borderRadius: '8px' }}>
            <h4 style={{ color: '#f1f1f1', marginTop: 0, marginBottom: '1rem' }}>Estrés de Energía (Amperios)</h4>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockHistoricalData} syncId="telemetria">
                <defs>
                  <linearGradient id="colorConsumo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff4d4d" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ff4d4d" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="time" stroke="#888" hide />
                <YAxis stroke="#ff4d4d" />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', color: '#fff' }} />
                <Area type="monotone" dataKey="consumo" stroke="#ff4d4d" strokeWidth={2} fillOpacity={1} fill="url(#colorConsumo)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* COLUMNA DERECHA: KPIs e Indicadores en Vivo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Tarjeta de RPM Instantáneas (Medio anillo) */}
          <div style={{ backgroundColor: '#2b2b2b', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
            <h4 style={{ color: '#f1f1f1', margin: 0 }}>Tacómetro</h4>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie
                  data={gaugeData}
                  cx="50%"
                  cy="100%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={70}
                  outerRadius={90}
                  dataKey="value"
                  stroke="none"
                >
                  <Cell fill={rpmColor} />
                  <Cell fill="#444" /> {/* Color del fondo del anillo */}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: rpmColor, marginTop: '-30px' }}>
              {liveData.rpm} <span style={{ fontSize: '1rem', color: '#888' }}>RPM</span>
            </div>
          </div>

          {/* Tarjeta de Entrada de Pedal (Barra) */}
          <div style={{ backgroundColor: '#2b2b2b', padding: '1rem', borderRadius: '8px' }}>
            <h4 style={{ color: '#f1f1f1', marginTop: 0 }}>Entrada Potenciómetro</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <ResponsiveContainer width="100%" height={40}>
                <BarChart data={pedalData} layout="vertical" margin={{ top: 0, left: 0, right: 0, bottom: 0 }}>
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis type="category" dataKey="name" hide />
                  <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#8884d8' }}>{liveData.potenciometro}%</div>
            </div>
          </div>

          {/* Tarjetas de Estadísticas Globales */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ backgroundColor: '#2b2b2b', padding: '1rem', borderRadius: '8px' }}>
              <div style={{ color: '#888', fontSize: '0.8rem', textTransform: 'uppercase' }}>Pico Consumo</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ff4d4d' }}>{liveData.consumoPico} A</div>
            </div>

            <div style={{ backgroundColor: '#2b2b2b', padding: '1rem', borderRadius: '8px' }}>
              <div style={{ color: '#888', fontSize: '0.8rem', textTransform: 'uppercase' }}>Fuente (VCC)</div>
              {/* Condicional de color si el voltaje cae por debajo de 11.5V */}
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: liveData.voltajeFuente < 11.5 ? '#ff4d4d' : '#00C49F' }}>
                {liveData.voltajeFuente} V
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
