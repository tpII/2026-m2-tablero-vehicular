#include <Arduino.h>
#include <PubSubClient.h>
#include <WiFi.h>

#include "../config.h"

constexpr uint16_t MQTT_BUFFER_SIZE = 512;
constexpr unsigned long MQTT_RETRY_MS = 2000;
constexpr uint16_t MQTT_SOCKET_TIMEOUT_S = 2;

static WiFiClient mqttNetwork;
static PubSubClient mqttClient(mqttNetwork);
static unsigned long mqttLastAttempt;

static void InitializeMqtt() {
  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  mqttClient.setBufferSize(MQTT_BUFFER_SIZE);
  mqttClient.setSocketTimeout(MQTT_SOCKET_TIMEOUT_S);
}

static bool IsMqttConnected() {
  return mqttClient.connected();
}

static void KeepMqttAlive() {
  if (mqttClient.connected()) {
    mqttClient.loop();
    return;
  }

  if (WiFi.status() != WL_CONNECTED) return;
  if (millis() - mqttLastAttempt < MQTT_RETRY_MS) return;

  mqttLastAttempt = millis();
  if (mqttClient.connect(MQTT_CLIENT_ID, MQTT_STATUS_TOPIC, 1, true, "offline")) mqttClient.publish(MQTT_STATUS_TOPIC, "online", true);
}

static bool PublishMqtt(const char *topic, const char *payload) {
  return mqttClient.publish(topic, payload);
}

static void PrintMqtt() {
  Serial.printf("MQTT: %s | State: %d\n", IsMqttConnected() ? "connected" : "disconnected", mqttClient.state());
}
