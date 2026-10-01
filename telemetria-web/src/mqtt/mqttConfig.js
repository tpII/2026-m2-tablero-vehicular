// Configuracion del broker. Se puede fijar en el build con VITE_MQTT_URL /
// VITE_MQTT_TOPIC, o desde la consola MQTT con localStorage ("mqtt.url").
// La IP es la del PC que corre Mosquitto; sirve tanto desde el navegador de
// esa misma maquina como desde un movil en la misma red.
const DEFAULT_URL = "ws://10.0.22.205:9001";
const DEFAULT_TOPIC = "vehiculo/m2/telemetria";

export const MQTT_URL =
  import.meta.env.VITE_MQTT_URL || localStorage.getItem("mqtt.url") || DEFAULT_URL;

export const MQTT_TOPIC =
  import.meta.env.VITE_MQTT_TOPIC || localStorage.getItem("mqtt.topic") || DEFAULT_TOPIC;

// Campos numericos que aceptamos del ESP32
const FIELDS = ["velocidad", "rpm", "maxRpm", "potenciometro", "bateria"];

// Number(null), Number("") y Number(true) dan 0/1: solo aceptamos numeros
// o cadenas numericas para no tomar un payload roto por un dato valido.
function toNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || value.trim() === "") return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

// Devuelve null si el payload no es un objeto JSON con datos utilizables.
export function parseTelemetry(payload) {
  let parsed;
  try {
    parsed = JSON.parse(payload);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;

  const data = {};
  for (const field of FIELDS) {
    const value = toNumber(parsed[field]);
    if (value !== null) data[field] = value;
  }

  return Object.keys(data).length ? data : null;
}
