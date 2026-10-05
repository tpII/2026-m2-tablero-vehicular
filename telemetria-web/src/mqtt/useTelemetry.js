import { useEffect, useMemo, useState } from "react";
import { useMqtt } from "./useMqtt";

// Datos crudos: los valores que manda el ESP32 en vehiculo/m2/telemetria
export const MOCK_DATA = {
  velocidad: 45,
  rpm: 3200,
  maxRpm: 6000,
  potenciometro: 75,
  bateria: 12.4,
};

// Si el broker deja de mandar mensajes, despues de esto pasamos a simulado
const STALE_MS = 3000;
const MOCK_PERIOD_MS = 1500;

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const round = (v, decimals) => Number(v.toFixed(decimals));
const walk = (value, step) => value + (Math.random() - 0.5) * 2 * step;

function nextMock(prev) {
  const velocidad = round(clamp(walk(prev.velocidad, 7), 0, 120), 0);
  const potenciometro = round(clamp(walk(prev.potenciometro, 11), 0, 100), 0);
  const rpmTarget = 800 + velocidad * 36 + potenciometro * 16;

  return {
    velocidad,
    potenciometro,
    rpm: Math.round(clamp(walk(prev.rpm, (rpmTarget - prev.rpm) / 3 + 90), 700, prev.maxRpm)),
    maxRpm: prev.maxRpm,
    bateria: round(clamp(walk(prev.bateria, 0.04), 10.5, 14), 1),
  };
}

// Une los datos reales del ESP32 con el simulador de respaldo: el panel nunca
// se queda sin valores, y si el ESP32 se desconecta seguimos viendo algo.
export default function useTelemetry() {
  const { status, data: mqttData, lastSeen, lastMessage } = useMqtt();
  const [mock, setMock] = useState(MOCK_DATA);
  const [now, setNow] = useState(() => Date.now());

  const connected = status === "conectado";
  const live = connected && mqttData !== null && now - lastSeen < STALE_MS;

  // El simulador solo corre cuando no hay telemetria real. Con el ESP32
  // conectado, generar valores al azar cada 1.5s no suma nada: el panel ya
  // muestra los datos de verdad.
  useEffect(() => {
    if (live) return undefined;

    const id = setInterval(() => setMock(nextMock), MOCK_PERIOD_MS);
    return () => clearInterval(id);
  }, [live]);

  // Reloj para detectar que los datos envejecieron (nadie re-renderiza solo).
  // Solo hace falta mientras hay datos vivos: si estamos mostrando el
  // simulador no hay nada que pueda quedar viejo.
  useEffect(() => {
    if (!live) return undefined;

    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [live]);

  // Fusionar dentro de useMemo mantiene la misma referencia mientras no cambien
  // las entradas. Armar el objeto en linea devolvia una referencia nueva en cada
  // render, y eso hacia disparar en bucle los efectos que dependen de `data`.
  const data = useMemo(
    () => (live ? { ...mock, ...mqttData } : mock),
    [live, mock, mqttData],
  );

  return {
    data,
    source: live ? "esp32" : "mock",
    status: live ? "conectado" : connected ? "sin-datos" : status,
    lastSeen,
    // Se pasa sin transformar: la consola de pruebas necesita el payload crudo
    // y el veredicto del parser, no solo los datos ya validados.
    lastMessage,
  };
}
