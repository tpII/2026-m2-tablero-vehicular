import { createContext, useContext } from "react";

export const MqttContext = createContext(null);

export function useMqtt() {
  const ctx = useContext(MqttContext);
  if (!ctx) throw new Error("useMqtt debe usarse dentro de <MqttProvider>");
  return ctx;
}
