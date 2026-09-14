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
  Legend,
} from "recharts";

const mockHistoricalData = [
  { time: "10:00:00", potenciometro: 0, rpm: 800, consumo: 0.5 },
  { time: "10:00:01", potenciometro: 20, rpm: 1200, consumo: 1.2 },
  { time: "10:00:02", potenciometro: 50, rpm: 2500, consumo: 3.5 },
  { time: "10:00:03", potenciometro: 80, rpm: 3800, consumo: 5.8 },
  { time: "10:00:04", potenciometro: 100, rpm: 4500, consumo: 6.2 },
  { time: "10:00:05", potenciometro: 100, rpm: 4800, consumo: 6.5 },
  { time: "10:00:06", potenciometro: 60, rpm: 3500, consumo: 3.0 },
  { time: "10:00:07", potenciometro: 10, rpm: 1500, consumo: 1.0 },
  { time: "10:00:08", potenciometro: 0, rpm: 800, consumo: 0.5 },
];

const liveData = {
  rpm: 4800,
  maxRpm: 6000,
  potenciometro: 100,
  consumoPico: 6.5,
  voltajeFuente: 12.1,
};

export default function Telemetry() {
  const rpmColor = liveData.rpm > 4500 ? "#ef4444" : "#10b981"; // Rojo o Verde brillante
  const gaugeData = [
    { name: "RPM", value: liveData.rpm },
    { name: "Restante", value: liveData.maxRpm - liveData.rpm },
  ];
  const pedalData = [{ name: "Pedal", value: liveData.potenciometro }];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2 style={{ margin: 0, color: "#f3f4f6" }}>Telemetry Overview</h2>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "7fr 3fr", gap: "2rem" }}
      >
        {/* COLUMNA IZQUIERDA */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <div className="dashboard-card" style={{ height: "350px" }}>
            <h4 className="card-title">Respuesta del Motor</h4>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={mockHistoricalData}
                syncId="telemetria"
                margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#1f2937"
                />
                <XAxis
                  dataKey="time"
                  stroke="#6b7280"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#6b7280"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  hide
                  domain={[0, 6000]}
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    borderRadius: "8px",
                    border: "1px solid #374151",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
                  }}
                  labelStyle={{
                    color: "#9ca3af",
                    fontWeight: "bold",
                    marginBottom: "5px",
                  }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                />

                {/* Acelerador: Área verde esmeralda */}
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="potenciometro"
                  name="Acelerador (%)"
                  fill="#10b981"
                  stroke="#10b981"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />

                {/* RPM: Línea azul */}
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="rpm"
                  name="Motor (RPM)"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: "#111827" }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="dashboard-card" style={{ height: "250px" }}>
            <h4 className="card-title">Estrés de Energía</h4>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={mockHistoricalData}
                syncId="telemetria"
                margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorConsumo" x1="0" y1="0" x2="0" y2="1">
                    {/* Color rojo anaranjado en el gradiente */}
                    <stop offset="5%" stopColor="#ff5722" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#ff5722" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#1f2937"
                />
                <XAxis dataKey="time" stroke="#6b7280" hide />
                <YAxis
                  stroke="#6b7280"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    borderRadius: "8px",
                    border: "1px solid #374151",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
                  }}
                />

                {/* Color rojo anaranjado en la línea principal */}
                <Area
                  type="monotone"
                  dataKey="consumo"
                  name="Corriente (A)"
                  stroke="#ff5722"
                  strokeWidth={3}
                  fill="url(#colorConsumo)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* COLUMNA DERECHA */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          <div className="dashboard-card" style={{ textAlign: "center" }}>
            <h4 className="card-title">Tacómetro</h4>
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
                  {/* Fondo del anillo oscuro */}
                  <Cell fill="#1f2937" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div
              style={{
                fontSize: "2.5rem",
                fontWeight: "800",
                color: "#f3f4f6",
                marginTop: "-20px",
              }}
            >
              {liveData.rpm}{" "}
              <span
                style={{
                  fontSize: "1rem",
                  color: "#9ca3af",
                  fontWeight: "600",
                }}
              >
                RPM
              </span>
            </div>
          </div>

          <div className="dashboard-card">
            <h4 className="card-title">Entrada Potenciómetro</h4>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <ResponsiveContainer width="100%" height={24}>
                <BarChart
                  data={pedalData}
                  layout="vertical"
                  margin={{ top: 0, left: 0, right: 0, bottom: 0 }}
                >
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis type="category" dataKey="name" hide />
                  <Bar
                    dataKey="value"
                    fill="#6366f1"
                    radius={[4, 4, 4, 4]}
                    background={{ fill: "#1f2937", radius: 4 }}
                  />
                </BarChart>
              </ResponsiveContainer>
              <div
                style={{
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                  color: "#818cf8",
                  width: "50px",
                  textAlign: "right",
                }}
              >
                {liveData.potenciometro}%
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
            }}
          >
            <div className="dashboard-card">
              <div className="card-title">Pico Consumo</div>
              <div
                style={{
                  fontSize: "1.8rem",
                  fontWeight: "800",
                  color: "#f3f4f6",
                }}
              >
                {liveData.consumoPico}{" "}
                <span style={{ fontSize: "1rem", color: "#9ca3af" }}>A</span>
              </div>
            </div>

            <div className="dashboard-card">
              <div className="card-title">Fuente (VCC)</div>
              <div
                style={{
                  fontSize: "1.8rem",
                  fontWeight: "800",
                  color: liveData.voltajeFuente < 11.5 ? "#ef4444" : "#f3f4f6",
                }}
              >
                {liveData.voltajeFuente}{" "}
                <span style={{ fontSize: "1rem", color: "#9ca3af" }}>V</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
