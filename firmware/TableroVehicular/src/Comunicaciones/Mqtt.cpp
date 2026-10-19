#include "Mqtt.h"

#include <PubSubClient.h>
#include <WiFi.h>

#include "../../config.h"

namespace {

// PubSubClient y WiFiClient no son thread-safe: los dos deben quedar en este
// nucleo y solo esta tarea los usa.
WiFiClient net;
PubSubClient mqtt(net);

QueueHandle_t colaEntrada = nullptr;

unsigned long ultimoIntentoWifi = 0;
unsigned long ultimoIntentoMqtt = 0;
unsigned long ultimaPublicacion = 0;
bool wifiReportado = false;

const unsigned long REINTENTO_MS = 2000;

void imprimeEstadoRed() {
  Serial.print("[wifi] IP: ");
  Serial.println(WiFi.localIP());
}

void mantieneWifi(unsigned long ahora) {
  if (WiFi.status() == WL_CONNECTED) {
    if (!wifiReportado) {
      wifiReportado = true;
      imprimeEstadoRed();
    }
    return;
  }

  wifiReportado = false;

  // Solo enviamos el comando de conexión la primera vez.
  // El auto-reconnect del ESP32 se encargará de las caídas.
  static bool wifiIniciado = false;
  if (!wifiIniciado) {
    Serial.printf("[wifi] conectando a \"%s\"...\n", WIFI_SSID);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    wifiIniciado = true;
  }
}

void publica(const Telemetry &lectura) {
  char payload[192];
  snprintf(payload, sizeof(payload),
           "{\"velocidad\":%.1f,\"rpm\":%.0f,\"maxRpm\":%.0f,"
           "\"potenciometro\":%.0f,\"bateria\":%.2f}",
           lectura.velocidad, lectura.rpm, lectura.maxRpm,
           lectura.potenciometro, lectura.bateria);

  mqtt.publish(MQTT_TOPIC, payload, true);
}

void mantieneMqtt(unsigned long ahora) {
  if (mqtt.connected())
    return;
  if (WiFi.status() != WL_CONNECTED)
    return;
  if (ahora - ultimoIntentoMqtt < REINTENTO_MS)
    return;

  ultimoIntentoMqtt = ahora;

  String clientId = String(MQTT_CLIENT_ID) + "-" + WiFi.macAddress();
  if (mqtt.connect(clientId.c_str(), MQTT_TOPIC, 0, true, "offline")) {
    Serial.printf("[mqtt] conectado como %s\n", clientId.c_str());
    mqtt.publish(MQTT_TOPIC, "online", true);
  } else {
    Serial.printf("[mqtt] fallo, estado %d\n", mqtt.state());
  }
}

void tareaMqtt(void *parametro) {
  (void)parametro;

  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  mqtt.setBufferSize(512);
  mqtt.setKeepAlive(30);
  mqtt.setSocketTimeout(5);

  Telemetry lectura;

  for (;;) {
    bool hayLectura = false;

    // Esperamos como máximo 50ms. Esto evita bloquear el bucle para siempre
    // y permite que la tarea siga atendiendo la red.
    if (xQueueReceive(colaEntrada, &lectura, pdMS_TO_TICKS(50)) == pdTRUE) {
      hayLectura = true;
    }

    unsigned long ahora = millis();

    mantieneWifi(ahora);
    mantieneMqtt(ahora);

    // VITAL: Mantiene viva la conexión MQTT y procesa mensajes entrantes
    if (mqtt.connected()) {
      mqtt.loop();
    }

    if (hayLectura && mqtt.connected() &&
        ahora - ultimaPublicacion >= PUBLISH_INTERVAL_MS) {
      ultimaPublicacion = ahora;
      publica(lectura);
    }
  }
}

} // namespace

void mqttInicia(QueueHandle_t entrada, UBaseType_t nucleo) {
  colaEntrada = entrada;

  xTaskCreatePinnedToCore(tareaMqtt, "mqtt", 4096, nullptr, PRIORIDAD_MQTT,
                          nullptr, nucleo);

  Serial.printf("[mqtt] nucleo %d, broker %s:%d, publicando cada %d ms\n",
                nucleo, MQTT_HOST, MQTT_PORT, PUBLISH_INTERVAL_MS);
}
