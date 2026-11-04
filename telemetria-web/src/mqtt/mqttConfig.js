// Configuracion del broker. Se puede fijar en el build con VITE_MQTT_URL /
// VITE_MQTT_TOPIC / VITE_MQTT_STATUS_TOPIC, o desde la consola MQTT con
// localStorage ("mqtt.url").
// La IP es la del PC que corre Mosquitto; sirve tanto desde el navegador de
// esa misma maquina como desde un movil en la misma red.
const DEFAULT_URL = "ws://10.181.76.217:9001";
const DEFAULT_TOPIC = "vehicle/m2/telemetry";
const DEFAULT_STATUS_TOPIC = "vehicle/m2/status";

export const MQTT_URL =
  import.meta.env.VITE_MQTT_URL ||
  localStorage.getItem("mqtt.url") ||
  DEFAULT_URL;

export const MQTT_TOPIC =
  import.meta.env.VITE_MQTT_TOPIC ||
  localStorage.getItem("mqtt.topic") ||
  DEFAULT_TOPIC;

export const MQTT_STATUS_TOPIC =
  import.meta.env.VITE_MQTT_STATUS_TOPIC ||
  localStorage.getItem("mqtt.statusTopic") ||
  DEFAULT_STATUS_TOPIC;

// Campos de la app y nombres publicados actualmente por el firmware.
const FIELDS = [
  { name: "velocidad", aliases: ["velocidad", "speed"] },
  { name: "rpm", aliases: ["rpm"] },
  { name: "maxRpm", aliases: ["maxRpm"] },
  { name: "potenciometro", aliases: ["potenciometro", "potentiometer"] },
  { name: "bateria", aliases: ["bateria", "battery"] },
  {
    name: "corrienteMotor",
    aliases: ["corrienteMotor", "current"],
    scale: { current: 0.001 },
  },
  { name: "tensionMotor", aliases: ["tensionMotor", "motorVoltage"] },
  {
    name: "potenciaMotor",
    aliases: ["potenciaMotor", "power"],
    scale: { power: 0.001 },
  },
];

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
    // Acepta temporalmente payloads de firmware anterior que serializan
    // valores no finitos como inf/NaN, aunque no sean literales JSON válidos.
    const json = payload.replace(
      /:\s*[-+]?(?:inf(?:inity)?|nan)(?=\s*[,}])/gi,
      ":null",
    );
    parsed = JSON.parse(json);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
    return null;

  const data = {};
  for (const { name, aliases, scale = {} } of FIELDS) {
    for (const alias of aliases) {
      if (!(alias in parsed)) continue;

      const value = toNumber(parsed[alias]);
      if (value !== null) data[name] = value * (scale[alias] ?? 1);
      break;
    }
  }

  return Object.keys(data).length ? data : null;
}
