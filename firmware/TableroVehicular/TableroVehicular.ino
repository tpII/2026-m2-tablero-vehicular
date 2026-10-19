#include <Arduino.h>
#include <WiFi.h>

#include "config.h"
#include "src/Comunicaciones/Mqtt.h"
#include "src/Pantalla/Pantalla.h"
#include "src/Sensores/Sensores.h"
#include "src/Telemetria/Telemetria.h"

// Por si tu placa no lo trae definido por defecto
#define LED_WIFI 26

QueueHandle_t colaMqtt;
QueueHandle_t colaPantalla;

void setup() {
  Serial.begin(115200);
  unsigned long espera = millis();
  while (!Serial && millis() - espera < 2000) {
  }

  // Inicializamos el pin del LED integrado
  pinMode(LED_WIFI, OUTPUT);

  WiFi.persistent(false);
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);

  colaMqtt = xQueueCreate(1, sizeof(Telemetry));
  colaPantalla = xQueueCreate(1, sizeof(Telemetry));

  // Los sensores van primero: es el unico que escribe en las colas.
  sensoresInicia(colaMqtt, colaPantalla, NUCLEO_SENSORES);
  mqttInicia(colaMqtt, NUCLEO_MQTT);
  pantallaInicia(colaPantalla, NUCLEO_PANTALLA);
}

// Las tres tareas reales viven en FreeRTOS.
// Usamos el loop() únicamente como monitor visual de red.
void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    // Si hay WiFi, el LED queda encendido fijo
    digitalWrite(LED_WIFI, HIGH);
    delay(1000); // Revisa el estado cada 1 segundo para no consumir CPU
  } else {
    // Si se desconecta o está intentando conectar, titila rápido
    digitalWrite(LED_WIFI, !digitalRead(LED_WIFI));
    delay(200);
  }
}
