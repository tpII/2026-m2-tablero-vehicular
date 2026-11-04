const BROKER_URL = "ws://localhost:9001";
const TEST_TOPIC = "vehicle/m2/test";
const TELEMETRY_TOPIC = "vehicle/m2/telemetry";
const STATUS_TOPIC = "vehicle/m2/status";

const state = document.getElementById("state");
const messages = document.getElementById("messages");
const client = mqtt.connect(BROKER_URL);

document.getElementById("broker").textContent = BROKER_URL;

client.on("connect", () => {
  state.textContent = "conectado";
  client.subscribe([TEST_TOPIC, TELEMETRY_TOPIC, STATUS_TOPIC]);
});

client.on("close", () => {
  state.textContent = "desconectado";
});

client.on("message", (topic, message) => {
  if (topic === TELEMETRY_TOPIC) {
    for (const [key, value] of Object.entries(JSON.parse(message.toString()))) {
      const cell = document.getElementById(key);
      if (cell) cell.textContent = value;
    }
    return;
  }

  const row = messages.insertRow(0);
  row.insertCell().textContent = new Date().toLocaleTimeString();
  row.insertCell().textContent = topic;
  row.insertCell().textContent = message.toString();
});
