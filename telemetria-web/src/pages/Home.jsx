import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";
import { useState } from "react";

// Simulamos los datos que llegarán del ESP32 por MQTT
const MOCK_LIVE_DATA = {
  velocidad: 45,
  rpm: 3200,
  maxRpm: 6000,
  potenciometro: 75,
  bateria: 12.4,
};

export default function Home() {
  const [data, setData] = useState(MOCK_LIVE_DATA);

  // Colores imitando los básicos de una TFT (Rojo, Verde, Azul, Amarillo puros)
  const rpmColor = data.rpm > 4500 ? "#FF0000" : "#00FF00"; // Rojo si pasa de 4500, sino Verde

  const gaugeData = [
    { name: "RPM", value: data.rpm },
    { name: "Restante", value: data.maxRpm - data.rpm },
  ];

  const pedalData = [{ name: "Pedal", value: data.potenciometro }];

  // Estilo para emular la pantalla TFT
  const tftScreenStyle = {
    backgroundColor: "#000000", // Negro puro
    border: "4px solid #1f2937", // Borde gris simulando el bisel de la pantalla
    borderRadius: "12px",
    padding: "2rem",
    display: "grid",
    gridTemplateColumns: "1fr 2fr 1fr", // Tres columnas: Batería, Velocímetro central, Pedal
    gap: "2rem",
    alignItems: "center",
    aspectRatio: "16 / 9", // Proporción típica de pantalla
    maxHeight: "600px",
    margin: "0 auto",
    boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
    fontFamily: "'Share Tech Mono', monospace", // Fuente estilo digital
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div style={{ textAlign: "center" }}>
        <h2
          style={{
            margin: 0,
            color: "#f3f4f6",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          Live Dashboard
        </h2>
        <p
          style={{
            color: "#9ca3af",
            marginTop: "0.5rem",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          Reflejo de la pantalla TFT física
        </p>
      </div>

      {/* CONTENEDOR QUE SIMULA LA PANTALLA FÍSICA */}
      <div style={tftScreenStyle}>
        {/* COLUMNA IZQUIERDA: Batería */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <div
            style={{
              color: "#00FFFF",
              fontSize: "1.2rem",
              textTransform: "uppercase",
            }}
          >
            BAT
          </div>
          <div
            style={{
              fontSize: "2.5rem",
              color: data.bateria < 11.5 ? "#FF0000" : "#00FFFF",
            }}
          >
            {data.bateria}v
          </div>
          <div
            style={{
              width: "60px",
              height: "150px",
              border: "3px solid #00FFFF",
              borderRadius: "4px",
              position: "relative",
              padding: "2px",
            }}
          >
            {/* Relleno de la batería */}
            <div
              style={{
                position: "absolute",
                bottom: "2px",
                left: "2px",
                right: "2px",
                height: `${(data.bateria / 14) * 100}%`, // Suponiendo max 14v
                backgroundColor: data.bateria < 11.5 ? "#FF0000" : "#00FFFF",
                transition: "height 0.3s ease",
              }}
            />
          </div>
        </div>

        {/* COLUMNA CENTRAL: Velocímetro (Ring Meter) */}
        <div style={{ textAlign: "center", position: "relative" }}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={gaugeData}
                cx="50%"
                cy="50%"
                startAngle={210}
                endAngle={-30}
                innerRadius="70%"
                outerRadius="90%"
                dataKey="value"
                stroke="none"
              >
                <Cell fill={rpmColor} />
                <Cell fill="#1a1a1a" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Datos digitales en el centro del anillo */}
          <div
            style={{
              position: "absolute",
              top: "55%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{ fontSize: "5rem", color: "#FFFFFF", lineHeight: "1" }}
            >
              {data.velocidad}
            </div>
            <div
              style={{
                color: "#FFFF00",
                fontSize: "1.5rem",
                marginTop: "0.5rem",
              }}
            >
              KM/H
            </div>
            <div
              style={{ color: rpmColor, fontSize: "2rem", marginTop: "1rem" }}
            >
              {data.rpm} <span style={{ fontSize: "1rem" }}>RPM</span>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: Acelerador (Barra vertical) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <div
            style={{
              color: "#FF00FF",
              fontSize: "1.2rem",
              textTransform: "uppercase",
            }}
          >
            THR
          </div>
          <div style={{ fontSize: "2.5rem", color: "#FF00FF" }}>
            {data.potenciometro}%
          </div>
          <ResponsiveContainer width={60} height={150}>
            <BarChart
              data={pedalData}
              margin={{ top: 0, left: 0, right: 0, bottom: 0 }}
            >
              <XAxis dataKey="name" hide />
              <YAxis domain={[0, 100]} hide />
              <Bar
                dataKey="value"
                fill="#FF00FF"
                background={{ fill: "#1a1a1a" }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
