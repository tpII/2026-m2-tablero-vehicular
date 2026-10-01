import { useEffect, useMemo, useState } from "react";
import mqtt from "mqtt";
import { MqttContext } from "./useMqtt";
import { MQTT_TOPIC, MQTT_URL, parseTelemetry } from "./mqttConfig";

// Una sola conexion para toda la app: reconecta sola y mantiene el ultimo
// estado, asi las paginas no abren un socket cada una.
export default function MqttProvider({ children }) {
  const [status, setStatus] = useState("conectando");
  const [data, setData] = useState(null);
  const [raw, setRaw] = useState(null);
  const [lastSeen, setLastSeen] = useState(0);
  const [messages, setMessages] = useState(0);

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

      setMessages((prev) => prev + 1);
      setRaw(payload);
      if (parsed) {
        setData(parsed);
        setLastSeen(Date.now());
      }
    });

    return () => client.end(true);
  }, []);

  const value = useMemo(
    () => ({ url: MQTT_URL, topic: MQTT_TOPIC, status, data, raw, lastSeen, messages }),
    [status, data, raw, lastSeen, messages],
  );

  return <MqttContext.Provider value={value}>{children}</MqttContext.Provider>;
}
