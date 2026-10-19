import { useEffect, useMemo, useState } from "react";
import mqtt from "mqtt";
import { MqttContext } from "./useMqtt";
import { MQTT_TOPIC, MQTT_URL, parseTelemetry } from "./mqttConfig";

// Una sola conexion para toda la app: reconecta sola y mantiene el ultimo
// estado, asi las paginas no abren un socket cada una.
export default function MqttProvider({ children }) {
  const [status, setStatus] = useState("conectando");
  const [data, setData] = useState(null);
  const [lastSeen, setLastSeen] = useState(0);

  // Ultimo mensaje recibido, sea o no telemetria valida. `seq` avanza con cada
  // mensaje y `ok` guarda si parseTelemetry lo acepto, para que la consola de
  // pruebas pueda mostrar tambien lo que no pudo interpretar en vez de
  // esconderlo. Va en un unico state para no disparar tres renders por mensaje.
  const [lastMessage, setLastMessage] = useState({
    seq: 0,
    payload: "",
    ok: false,
    at: 0,
  });

  useEffect(() => {
    const client = mqtt.connect(MQTT_URL, {
      reconnectPeriod: 3000,
      connectTimeout: 10000,
      clean: true,
    });

    client.on("connect", () => {
      setStatus("conectado");
      client.subscribe(MQTT_TOPIC, { qos: 0 });
    });

    client.on("reconnect", () => setStatus("reconectando"));
    client.on("close", () => setStatus("reconectando"));
    client.on("offline", () => setStatus("reconectando"));
    client.on("error", () => setStatus("error"));

    client.on("message", (topic, message) => {
      const payload = message.toString();
      const parsed = parseTelemetry(payload);

      // Solo lo que parsea avanza los datos del panel; el LWT retained
      // ("online"/"offline") y el JSON corrupto no los tocan.
      if (parsed) {
        setData(parsed);
        setLastSeen(Date.now());
      }

      // Pero todos los mensajes se cuentan, validos o no.
      setLastMessage((prev) => ({
        seq: prev.seq + 1,
        payload,
        ok: parsed !== null,
        at: Date.now(),
      }));
    });

    return () => client.end(true);
  }, []);

  const value = useMemo(
    () => ({ url: MQTT_URL, topic: MQTT_TOPIC, status, data, lastSeen, lastMessage }),
    [status, data, lastSeen, lastMessage],
  );

  return <MqttContext.Provider value={value}>{children}</MqttContext.Provider>;
}
