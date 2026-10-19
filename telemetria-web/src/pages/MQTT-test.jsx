import { useState, useEffect, useRef } from "react";
import useTelemetry from "../mqtt/useTelemetry";

// El provider solo emite estados en espanol y useTelemetry agrega "sin-datos"
// cuando hay conexion pero la telemetria llego vieja. Antes se comparaba
// contra "Connected", que nunca se emitia, y una conexion sana quedaba ambar.
const COLOR_POR_ESTADO = {
  conectado: "#10b981",
  "sin-datos": "#f59e0b",
  reconectando: "#f59e0b",
  conectando: "#9ca3af",
  error: "#ef4444",
};

export default function MQTTTest() {
  const { source, status, lastMessage } = useTelemetry();
  const live = source === "esp32";

  // Estado para almacenar el historial de mensajes
  const [logs, setLogs] = useState([]);

  // Referencia para hacer auto-scroll automático hacia abajo
  const logContainerRef = useRef(null);

  // Clave estable por fila. Con lastSeen + Math.random() todas las claves
  // cambiaban en cada agregado, y React recreaba las 50 filas enteras.
  const nextLogId = useRef(0);

  // lastMessage solo cambia cuando entra un mensaje por el broker, asi que es
  // el unico disparador correcto para agregar una linea. Logueamos el payload
  // crudo, no el objeto fusionado con el simulador: asi se ve lo que vino por
  // el cable, y los mensajes que el parser rechazo (LWT "online"/"offline",
  // JSON roto) tambien quedan a la vista en vez de desaparecer.
  useEffect(() => {
    if (!lastMessage.seq) return;

    const newLog = {
      id: nextLogId.current++,
      time: new Date(lastMessage.at).toLocaleTimeString(),
      ok: lastMessage.ok,
      payload: lastMessage.payload,
    };

    // Guardamos los últimos 50 mensajes para no saturar la memoria
    setLogs((prevLogs) => [...prevLogs, newLog].slice(-50));
  }, [lastMessage]);

  // Si el usuario esta pegado al final, cada mensaje nuevo lo sigue. Si subio a
  // leer algo, no lo movemos. Va en una ref y no en estado porque solo lo
  // consultamos desde el efecto: asi no dispara renders.
  const pegadoAlFinal = useRef(true);
  const handleScroll = () => {
    const el = logContainerRef.current;
    if (!el) return;
    pegadoAlFinal.current =
      el.scrollHeight - el.scrollTop - el.clientHeight <= 4;
  };

  // Auto-scroll: sigue la cola solo si ya estabamos al final. El rAF agrupa la
  // escritura en un frame para no competir con el render por el hilo.
  useEffect(() => {
    const el = logContainerRef.current;
    if (!el || !pegadoAlFinal.current) return undefined;

    const frame = requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
    return () => cancelAnimationFrame(frame);
  }, [logs]);

  // Función para limpiar la consola
  const clearLogs = () => {
    // Al vaciarla no queda nada que scrollear, asi que el navegador no dispara
    // ningun evento de scroll: si el flag quedara en false (porque estabamos
    // leyendo mas arriba), los mensajes siguientes nunca mas seguirian la cola.
    pegadoAlFinal.current = true;
    setLogs([]);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
        // Sin height: el <main> de Layout no tiene altura definida, asi que un
        // 100% aqui se resuelve como auto y no acota nada. El alto de la
        // consola lo define su propia caja mas abajo.
      }}
    >
      {/* CABECERA */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2 style={{ margin: 0, color: "#f3f4f6" }}>MQTT & Connection Test</h2>
        <button
          onClick={clearLogs}
          style={{
            backgroundColor: "#374151",
            color: "#f3f4f6",
            border: "none",
            padding: "8px 16px",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Limpiar Consola
        </button>
      </div>

      {/* PANEL DE ESTADO */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "1.5rem",
        }}
      >
        <div
          className="dashboard-card"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
          }}
        >
          <h4 className="card-title" style={{ margin: "0 0 10px 0" }}>
            Estado del Broker
          </h4>
          <div
            style={{
              fontSize: "1.2rem",
              fontWeight: "bold",
              color: COLOR_POR_ESTADO[status] ?? "#9ca3af",
            }}
          >
            {status || "Desconectado"}
          </div>
        </div>

        <div
          className="dashboard-card"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
          }}
        >
          <h4 className="card-title" style={{ margin: "0 0 10px 0" }}>
            Fuente de Datos
          </h4>
          <div
            style={{
              fontSize: "1.2rem",
              fontWeight: "bold",
              color: live ? "#3b82f6" : "#6b7280",
            }}
          >
            {source ? source.toUpperCase() : "NINGUNA"}
          </div>
        </div>

        <div
          className="dashboard-card"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
          }}
        >
          <h4 className="card-title" style={{ margin: "0 0 10px 0" }}>
            Último Mensaje
          </h4>
          <div
            style={{
              fontSize: "1.2rem",
              fontWeight: "bold",
              color: "#f3f4f6",
              fontFamily: "monospace",
            }}
          >
            {lastMessage.seq
              ? new Date(lastMessage.at).toLocaleTimeString()
              : "--:--:--"}
          </div>
        </div>
      </div>

      {/* CONSOLA DE MENSAJES (TERMINAL) */}
      <div
        className="dashboard-card"
        style={{
          display: "flex",
          flexDirection: "column",
          // Alto definido y acotado al viewport. Sin esto la tarjeta crece con
          // cada mensaje y termina scrolleando la pagina entera; con min() se
          // adapta a pantallas grandes y chicas sin pasar del alto disponible.
          // No lleva flexGrow porque su altura ya no depende del espacio libre
          // del padre. Tampoco box-sizing global en el proyecto, asi que sin
          // esto el height mide solo el contenido y el padding de
          // .dashboard-card se sumaria por fuera.
          boxSizing: "border-box",
          height: "min(60vh, 640px)",
          minHeight: "240px",
        }}
      >
        <h4 className="card-title">Log de Mensajes MQTT</h4>

        <div
          ref={logContainerRef}
          onScroll={handleScroll}
          style={{
            backgroundColor: "#111827", // Fondo negro/oscuro tipo terminal
            borderRadius: "6px",
            padding: "1rem",
            flexGrow: 1,
            // Un flex item no baja de su altura intrinsea mientras tenga
            // min-height:auto, y entonces el overflow nunca se activa: la lista
            // seguia estirando la tarjeta en vez de scrollear adentro.
            minHeight: 0,
            overflowY: "auto",
            fontFamily: "monospace",
            fontSize: "0.9rem",
            color: "#a7f3d0", // Verde terminal
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {logs.length === 0 ? (
            <div
              style={{
                color: "#6b7280",
                fontStyle: "italic",
                textAlign: "center",
                marginTop: "2rem",
              }}
            >
              Esperando recibir datos...
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                style={{
                  display: "flex",
                  gap: "10px",
                  borderBottom: "1px solid #1f2937",
                  paddingBottom: "4px",
                }}
              >
                <span style={{ color: "#6b7280", minWidth: "80px" }}>
                  [{log.time}]
                </span>
                <span
                  style={{
                    color: log.ok ? "#3b82f6" : "#ef4444",
                    minWidth: "60px",
                  }}
                >
                  [{log.ok ? "json" : "raw"}]
                </span>
                <span style={{ color: "#e5e7eb", wordBreak: "break-all" }}>
                  {log.payload}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
