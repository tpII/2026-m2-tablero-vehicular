#include <Arduino.h>
#include <PubSubClient.h>
#include <WiFi.h>

#include "../config.h"

constexpr uint16_t MQTT_BUFFER_SIZE = 512;
constexpr unsigned long MQTT_RETRY_MS = 2000;

static WiFiClient mqttNetwork;
static PubSubClient mqttClient(mqttNetwork);
static unsigned long mqttLastAttempt;

static void InitializeMqtt() {
  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  mqttClient.setBufferSize(MQTT_BUFFER_SIZE);
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
  mqttClient.connect(MQTT_CLIENT_ID);
}

static bool PublishMqtt(const char *topic, const char *payload) {
  return mqttClient.publish(topic, payload);
}

static void PrintMqtt() {
  Serial.printf("MQTT: %s | State: %d\n", IsMqttConnected() ? "connected" : "disconnected", mqttClient.state());
}
