import { useEffect, useRef, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  PieChart,
  Pie,
  Cell,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { TimeSeries, SmoothieChart } from "smoothie";
import useTelemetry from "../mqtt/useTelemetry";

export default function Telemetry() {
  const { data, source, status, deviceStatus, lastSeen } = useTelemetry();
  const live = source === "esp32";
  const [energyData, setEnergyData] = useState([]);
  const wasLive = useRef(false);
  const lastEnergySample = useRef(null);

  // Referencias para SmoothieCharts
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const seriesAcelerador = useRef(new TimeSeries());
  const seriesRpm = useRef(new TimeSeries());

  useEffect(() => {
    if (!live) {
      wasLive.current = false;
      lastEnergySample.current = null;
      return;
    }

    if (
      !Number.isFinite(data.corrienteMotor) ||
      lastSeen === lastEnergySample.current
    ) {
      return;
    }

    const startNewSeries = !wasLive.current;
    wasLive.current = true;
    lastEnergySample.current = lastSeen;
    setEnergyData((previous) => [
      ...(startNewSeries ? [] : previous).slice(-59),
      {
        time: new Date(lastSeen).toLocaleTimeString(),
        corriente: data.corrienteMotor,
      },
    ]);
  }, [lastSeen, live, data.corrienteMotor]);

  // Inicialización de SmoothieCharts
  useEffect(() => {
    if (!canvasRef.current) return;

    // Configuración del gráfico
    chartRef.current = new SmoothieChart({
      responsive: true, // Esto soluciona que canvas canvas no se vea
      millisPerPixel: 15,
      grid: {
        fillStyle: "transparent",
        strokeStyle: "#1f2937",
        verticalSections: 4,
        millisPerLine: 2000,
      },
      labels: {
        fillStyle: "#9ca3af",
        fontSize: 12,
        precision: 0,
        showIntermediateLabels: true,
      },
      interpolation: "bezier",
      maxValue: 100,
      minValue: 0,
    });

    // Serie del Acelerador
    chartRef.current.addTimeSeries(seriesAcelerador.current, {
      strokeStyle: "#10b981",
      fillStyle: "rgba(16, 185, 129, 0.15)",
      lineWidth: 2,
    });

    // Serie de RPM
    chartRef.current.addTimeSeries(seriesRpm.current, {
      strokeStyle: "#3b82f6",
      lineWidth: 3,
    });

    chartRef.current.streamTo(canvasRef.current, 0);

    return () => {
      if (chartRef.current) {
        chartRef.current.stop();
      }
    };
  }, []); // Se ejecuta solo una vez al montar

  // Actualizar los datos de SmoothieCharts
  // Actualizar los datos de SmoothieCharts
  useEffect(() => {
    if (!live || !lastSeen) return;

    const time = new Date().getTime();

    // 1. El potenciómetro ya es un valor de 0 a 100, se inserta directo.
    seriesAcelerador.current.append(time, data.potenciometro);

    // 2. Las RPM (ej: 3000) se dividen por el máximo (ej: 6000) y se multiplican por 100.
    // Así, 3000 RPM se grafican en la línea del 50%.
    const max = data.maxRpm || 6000;
    const rpmEnPorcentaje = (data.rpm / max) * 100;

    seriesRpm.current.append(time, rpmEnPorcentaje);
  }, [lastSeen, data.potenciometro, data.rpm, live, data.maxRpm]);

  const rpm = Math.round(data.rpm);
  const potenciometro = Math.round(data.potenciometro);
  const corrienteMotor = Number.isFinite(data.corrienteMotor)
    ? data.corrienteMotor.toFixed(3)
    : "--";
  const tensionMotor = Number.isFinite(data.tensionMotor)
    ? data.tensionMotor.toFixed(3)
    : "--";
  const potenciaMotor = Number.isFinite(data.potenciaMotor)
    ? data.potenciaMotor.toFixed(3)
    : "--";
  const energyChartData =
    live && Number.isFinite(data.corrienteMotor) ? energyData : [];

  const rpmColor = data.rpm > data.maxRpm * 0.75 ? "#ef4444" : "#10b981";
  const gaugeData = [
    { name: "RPM", value: Math.min(data.rpm, data.maxRpm) },
    { name: "Restante", value: Math.max(0, data.maxRpm - data.rpm) },
  ];
  const pedalData = [{ name: "Pedal", value: data.potenciometro }];

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
        <span
          style={{
            fontFamily: "monospace",
            fontSize: "0.85rem",
            color: live ? "#10b981" : "#f59e0b",
          }}
        >
          {live ? "TELEMETRÍA EN VIVO" : "SIN DATOS"} · Broker: {status} · ESP32: {deviceStatus}
        </span>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "7fr 3fr", gap: "2rem" }}
      >
        {/* COLUMNA IZQUIERDA */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <div
            className="dashboard-card"
            style={{ height: "350px", position: "relative" }}
          >
            <h4 className="card-title">Respuesta del Motor</h4>

            {/* LEYENDA MANUAL SMOOTHIECHARTS */}
            <div
              style={{
                display: "flex",
                gap: "15px",
                justifyContent: "center",
                marginBottom: "10px",
                fontSize: "12px",
                color: "#9ca3af",
              }}
            >
              <span
                style={{ display: "flex", alignItems: "center", gap: "5px" }}
              >
                <div
                  style={{
                    width: "10px",
                    height: "10px",
                    backgroundColor: "#10b981",
                    borderRadius: "50%",
                  }}
                ></div>{" "}
                Acelerador
              </span>
              <span
                style={{ display: "flex", alignItems: "center", gap: "5px" }}
              >
                <div
                  style={{
                    width: "10px",
                    height: "10px",
                    backgroundColor: "#3b82f6",
                    borderRadius: "50%",
                  }}
                ></div>{" "}
                Motor (RPM)
              </span>
            </div>

            {/* CONTENEDOR DEL CANVAS */}
            <div
              style={{
                width: "100%",
                height: "calc(100% - 40px)",
                overflow: "hidden",
              }}
            >
              <canvas
                ref={canvasRef}
                width={800} /* Agrega esto */
                height={300} /* Agrega esto */
                style={{ width: "100%", height: "100%", display: "block" }}
              ></canvas>
            </div>
          </div>

          <div className="dashboard-card" style={{ height: "250px" }}>
            <h4 className="card-title">Consumo del motor (INA219)</h4>
            <div style={{ height: "calc(100% - 30px)", position: "relative" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={energyChartData}
                  margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorConsumoMotor"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
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
                  <Area
                    type="monotone"
                    dataKey="corriente"
                    name="Corriente (A)"
                    stroke="#ff5722"
                    strokeWidth={3}
                    fill="url(#colorConsumoMotor)"
                  />
                </AreaChart>
              </ResponsiveContainer>
              {energyChartData.length === 0 && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "grid",
                    placeItems: "center",
                    color: "#9ca3af",
                    pointerEvents: "none",
                  }}
                >
                  Esperando lectura del INA219
                </div>
              )}
            </div>
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
                  isAnimationActive={true}
                  animationDuration={100}
                >
                  <Cell fill={rpmColor} />
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
              {rpm}{" "}
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
                    isAnimationActive={true}
                    animationDuration={100}
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
                {potenciometro}%
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: "1rem",
            }}
          >
            <div className="dashboard-card">
              <div className="card-title">Corriente del motor</div>
              <div
                style={{
                  fontSize: "1.8rem",
                  fontWeight: "800",
                  color: "#f3f4f6",
                }}
              >
                {corrienteMotor}{" "}
                <span style={{ fontSize: "1rem", color: "#9ca3af" }}>A</span>
              </div>
            </div>

            <div className="dashboard-card">
              <div className="card-title">Tensión del motor</div>
              <div
                style={{
                  fontSize: "1.8rem",
                  fontWeight: "800",
                  color: "#f3f4f6",
                }}
              >
                {tensionMotor}{" "}
                <span style={{ fontSize: "1rem", color: "#9ca3af" }}>V</span>
              </div>
            </div>

            <div className="dashboard-card">
              <div className="card-title">Potencia del motor</div>
              <div
                style={{
                  fontSize: "1.8rem",
                  fontWeight: "800",
                  color: "#f3f4f6",
                }}
              >
                {potenciaMotor}{" "}
                <span style={{ fontSize: "1rem", color: "#9ca3af" }}>W</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
