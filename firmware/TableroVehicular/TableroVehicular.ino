#include <Arduino.h>
#include <PubSubClient.h>
#include <WiFi.h>

#include "config.h"

WiFiClient net;
PubSubClient mqtt(net);

unsigned long lastPublish = 0;
unsigned long lastWifiRetry = 0;
unsigned long lastMqttRetry = 0;
unsigned long lastSimulacion = 0;
unsigned long nextScenarioChange = 0;
bool wifiReportado = false;
const unsigned long RETRY_MS = 2000;

// Simulacion: los sensores reales se reemplazan aqui en bloques posteriores
float velocidad = 0;
float velocidadObjetivo = 0;
float potenciometro = 0;
float bateria = 12.6;

float limita(float valor, float min, float max) {
  if (valor < min) return min;
  if (valor > max) return max;
  return valor;
}

float acerca(float actual, float objetivo, float factor) {
  return actual + (objetivo - actual) * factor;
}

// Sierra calada por marcha: sube dentro de cada marcha y cae al cambiar
float calculaRpm(float kmh) {
  const float velMax = 140.0f;
  const int marches = 6;
  const float ralenti = 800.0f;

  float posicion = limita(kmh / velMax, 0.0f, 1.0f) / (1.0f / marches);
  int marcha = constrain((int)posicion, 0, marches - 1);
  float dentro = (posicion - marcha) * 0.88f;

  return ralenti + dentro * (MAX_RPM - ralenti);
}

void imprimeEstadoRed() {
  Serial.print("[wifi] IP: ");
  Serial.println(WiFi.localIP());
}

void conectaWifi() {
  Serial.printf("[wifi] conectando a \"%s\"...\n", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
}

void mantieneWifi(unsigned long ahora) {
  if (WiFi.status() == WL_CONNECTED) {
    if (!wifiReportado) {
      wifiReportado = true;
      imprimeEstadoRed();
    }
    return;
  }

  if (ahora - lastWifiRetry < RETRY_MS) return;

  wifiReportado = false;
  lastWifiRetry = ahora;
  conectaWifi();
}

void publicaTelemetria() {
  char payload[192];
  snprintf(payload, sizeof(payload),
           "{\"velocidad\":%.1f,\"rpm\":%.0f,\"maxRpm\":%.0f,"
           "\"potenciometro\":%.0f,\"bateria\":%.2f}",
           velocidad, calculaRpm(velocidad), (float)MAX_RPM, potenciometro, bateria);

  // retain para que la web muestre el ultimo valor nada mas suscribirse
  mqtt.publish(MQTT_TOPIC, payload, true);
}

void conectaMqtt() {
  String clientId = String(MQTT_CLIENT_ID) + "-" + WiFi.macAddress();
  bool ok = mqtt.connect(clientId, MQTT_TOPIC, 0, true, "offline");

  if (ok) {
    Serial.printf("[mqtt] conectado como %s\n", clientId.c_str());
    mqtt.publish(MQTT_TOPIC, "online", true);
  } else {
    Serial.printf("[mqtt] fallo, estado %d\n", mqtt.state());
  }
}

void mantieneMqtt(unsigned long ahora) {
  if (WiFi.status() != WL_CONNECTED) return;
  if (mqtt.connected()) return;
  if (ahora - lastMqttRetry < RETRY_MS) return;

  lastMqttRetry = ahora;
  conectaMqtt();
}

void actualizaSimulacion(unsigned long ahora) {
  float segundos = lastSimulacion == 0 ? 0.0f : (ahora - lastSimulacion) / 1000.0f;
  lastSimulacion = ahora;

  if (ahora >= nextScenarioChange) {
    nextScenarioChange = ahora + 4000 + random(6000);
    velocidadObjetivo = random(0, 131);
  }

  velocidad = acerca(velocidad, velocidadObjetivo, 0.06f);

  // El acelerador responde a la diferencia entre velocidad deseada y real
  float demanda = limita((velocidadObjetivo - velocidad) * 7.0f, 0.0f, 100.0f);
  if (velocidadObjetivo < velocidad) demanda = 0;
  potenciometro = acerca(potenciometro, demanda, 0.12f);

  // El alternador recarga por encima de 3000 rpm y consume el resto
  if (calculaRpm(velocidad) > 3000) {
    bateria = limita(bateria + 0.004f * segundos, 11.8f, 14.4f);
  } else {
    bateria = limita(bateria - 0.00008f * segundos, 11.8f, 14.4f);
  }
}

void setup() {
  Serial.begin(115200);
  unsigned long espera = millis();
  while (!Serial && millis() - espera < 2000) {
  }

  randomSeed(esp_random());

  WiFi.persistent(false);
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);

  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  mqtt.setBufferSize(512);
  mqtt.setKeepAlive(30);
  mqtt.setSocketTimeout(5);

  conectaWifi();
}

void loop() {
  unsigned long ahora = millis();

  mantieneWifi(ahora);
  mantieneMqtt(ahora);

  actualizaSimulacion(ahora);

  if (mqtt.connected() && ahora - lastPublish >= PUBLISH_INTERVAL_MS) {
    lastPublish = ahora;
    publicaTelemetria();
  }

  delay(10);
}
