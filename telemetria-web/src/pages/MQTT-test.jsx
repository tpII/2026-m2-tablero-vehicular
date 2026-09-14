import { useState, useEffect } from "react";
import mqtt from "mqtt";

export default function MQTTTest() {
  const [client, setClient] = useState(null);
  const [connectStatus, setConnectStatus] = useState("Desconectado");
  const [brokerUrl, setBrokerUrl] = useState("ws://localhost:9001");
  const [topic, setTopic] = useState("vehiculo/m2/telemetria");
  const [messages, setMessages] = useState([]);

  const handleConnect = () => {
    setConnectStatus("Conectando...");
    const mqttClient = mqtt.connect(brokerUrl);

    mqttClient.on("connect", () => {
      setConnectStatus("Conectado");
      mqttClient.subscribe(topic);
    });

    mqttClient.on("error", (err) => {
      console.error("Error:", err);
      setConnectStatus("Error de Conexión");
      mqttClient.end();
    });

    mqttClient.on("message", (receivedTopic, message) => {
      const newMessage = {
        topic: receivedTopic,
        payload: message.toString(),
        time: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [newMessage, ...prev]);
    });

    setClient(mqttClient);
  };

  const handleDisconnect = () => {
    if (client) {
      client.end();
      setClient(null);
      setConnectStatus("Desconectado");
    }
  };

  const handlePublishTest = () => {
    if (client && connectStatus === "Conectado") {
      const testData = {
        velocidad: Math.floor(Math.random() * 120),
        rpm: Math.floor(Math.random() * 6000),
        bateria: (11 + Math.random() * 2).toFixed(1), // Batería entre 11.0 y 13.0
      };
      client.publish(topic, JSON.stringify(testData));
    }
  };

  useEffect(() => {
    return () => {
      if (client) client.end();
    };
  }, [client]);

  // Estilos reutilizables para los inputs
  const inputStyle = {
    backgroundColor: "#1f2937", // Gris oscuro a tono con las tarjetas
    color: "#f3f4f6",
    border: "1px solid #374151",
    borderRadius: "6px",
    padding: "0.75rem 1rem",
    fontSize: "0.95rem",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    fontFamily: "monospace",
  };

  // Estilos reutilizables para los botones
  const btnStyle = {
    padding: "0.75rem 1.5rem",
    borderRadius: "6px",
    border: "none",
    fontWeight: "600",
    cursor: "pointer",
    transition: "opacity 0.2s ease",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <h2 style={{ margin: 0, color: "#f3f4f6" }}>
        Consola de Pruebas MQTT (Local)
      </h2>

      {/* CONTROLES DE CONEXIÓN EN UNA TARJETA */}
      <div className="dashboard-card">
        <h4 className="card-title">Configuración del Broker</h4>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "1.5rem",
            marginBottom: "1.5rem",
          }}
        >
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            <label
              style={{
                color: "#9ca3af",
                fontSize: "0.85rem",
                fontWeight: "600",
              }}
            >
              WebSocket URL
            </label>
            <input
              type="text"
              value={brokerUrl}
              onChange={(e) => setBrokerUrl(e.target.value)}
              disabled={connectStatus === "Conectado"}
              style={{
                ...inputStyle,
                opacity: connectStatus === "Conectado" ? 0.6 : 1,
              }}
            />
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            <label
              style={{
                color: "#9ca3af",
                fontSize: "0.85rem",
                fontWeight: "600",
              }}
            >
              Tópico a suscribir/publicar
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={connectStatus === "Conectado"}
              style={{
                ...inputStyle,
                opacity: connectStatus === "Conectado" ? 0.6 : 1,
              }}
            />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "1rem",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={handleConnect}
            disabled={
              connectStatus === "Conectado" || connectStatus === "Conectando..."
            }
            style={{
              ...btnStyle,
              backgroundColor: "#10b981",
              color: "#ffffff",
              opacity: connectStatus === "Conectado" ? 0.5 : 1,
            }}
          >
            Conectar
          </button>

          <button
            onClick={handleDisconnect}
            disabled={connectStatus === "Desconectado"}
            style={{
              ...btnStyle,
              backgroundColor: "#ef4444",
              color: "#ffffff",
              opacity: connectStatus === "Desconectado" ? 0.5 : 1,
            }}
          >
            Desconectar
          </button>

          <span
            style={{
              fontWeight: "600",
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              backgroundColor:
                connectStatus === "Conectado"
                  ? "rgba(16, 185, 129, 0.1)"
                  : connectStatus === "Error de Conexión"
                    ? "rgba(239, 68, 68, 0.1)"
                    : "rgba(156, 163, 175, 0.1)",
              color:
                connectStatus === "Conectado"
                  ? "#10b981"
                  : connectStatus === "Error de Conexión"
                    ? "#ef4444"
                    : "#9ca3af",
            }}
          >
            Estado: {connectStatus}
          </span>

          <button
            onClick={handlePublishTest}
            disabled={connectStatus !== "Conectado"}
            style={{
              ...btnStyle,
              backgroundColor: "#3b82f6",
              color: "#ffffff",
              marginLeft: "auto",
              opacity: connectStatus !== "Conectado" ? 0.5 : 1,
            }}
          >
            🚀 Enviar Dato de Prueba
          </button>
        </div>
      </div>

      {/* HISTORIAL DE MENSAJES EN OTRA TARJETA */}
      <div className="dashboard-card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
          }}
        >
          <h4 className="card-title" style={{ margin: 0 }}>
            Mensajes Recibidos ({messages.length})
          </h4>

          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              style={{
                ...btnStyle,
                padding: "0.4rem 1rem",
                fontSize: "0.85rem",
                backgroundColor: "#374151",
                color: "#f3f4f6",
              }}
            >
              Limpiar Historial
            </button>
          )}
        </div>

        {/* Terminal Box */}
        <div
          style={{
            backgroundColor: "#0b0f19", // Fondo de terminal real
            color: "#a9b7c6",
            padding: "1.5rem",
            borderRadius: "8px",
            border: "1px solid #1f2937",
            height: "400px",
            overflowY: "auto",
            fontFamily: "monospace",
            fontSize: "0.9rem",
            lineHeight: "1.5",
          }}
        >
          {messages.length === 0 ? (
            <div
              style={{
                color: "#4b5563",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }}
            >
              Esperando mensajes...
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} style={{ marginBottom: "1rem" }}>
                <span style={{ color: "#6366f1" }}>[{msg.time}] </span>
                <span style={{ color: "#9ca3af" }}>{msg.topic}</span>
                <div
                  style={{
                    color: "#10b981",
                    paddingLeft: "1rem",
                    marginTop: "0.2rem",
                  }}
                >
                  {msg.payload}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
