const BROKER_URL = "ws://localhost:9001";
const TELEMETRY_TOPIC = "vehicle/m2/telemetry";
const STATUS_TOPIC = "vehicle/m2/status";
const LOG_LINES = 200;

const history = [];
const logLines = [];
const log = document.getElementById("log");
const count = document.getElementById("count");
const client = mqtt.connect(BROKER_URL);

document.getElementById("broker").textContent = BROKER_URL;

function setState(id, text, className) {
  const element = document.getElementById(id);
  element.textContent = text;
  element.className = `state ${className}`;
}

function parse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function showTelemetry(data) {
  for (const [key, value] of Object.entries(data)) {
    const cell = document.getElementById(key);
    if (cell) cell.textContent = typeof value === "number" ? value.toFixed(cell.dataset.decimals) : "-";
  }
}

function addLog(line) {
  logLines.unshift(line);
  if (logLines.length > LOG_LINES) logLines.pop();
  log.textContent = logLines.join("\n");
}

client.on("connect", () => {
  setState("brokerState", "conectado", "on");
  client.subscribe([TELEMETRY_TOPIC, STATUS_TOPIC]);
});

client.on("reconnect", () => {
  setState("brokerState", "reconectando", "");
});

client.on("close", () => {
  setState("brokerState", "desconectado", "off");
  setState("deviceState", "desconocido", "");
});

client.on("message", (topic, message) => {
  const text = message.toString();
  const now = new Date();
  const payload = parse(text);

  history.push({ timestamp: now.toISOString(), topic, payload });
  count.textContent = history.length;
  addLog(`${now.toLocaleTimeString()}  ${topic}  ${text}`);

  if (topic === STATUS_TOPIC) setState("deviceState", text === "online" ? "conectado" : "desconectado", text === "online" ? "on" : "off");
  if (topic === TELEMETRY_TOPIC && typeof payload === "object" && payload) showTelemetry(payload);
});

document.getElementById("export").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(history, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `telemetria-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href));
});
