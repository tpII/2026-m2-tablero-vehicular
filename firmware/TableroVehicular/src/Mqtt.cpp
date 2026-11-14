#include <Arduino.h>
#include <PubSubClient.h>
#include <WiFi.h>

#include "../config.h"

constexpr uint16_t MQTT_BUFFER_SIZE = 512;
constexpr unsigned long MQTT_RETRY_MS = 2000;

struct TelemetryPayload {
  char json[384];
};

static WiFiClient mqttNetwork;
static PubSubClient mqttClient(mqttNetwork);
static unsigned long mqttLastAttempt;

static QueueHandle_t mqttQueue;
static TaskHandle_t mqttHandle;

static bool IsMqttConnected() { return mqttClient.connected(); }

static void KeepMqttAlive() {
  if (mqttClient.connected()) {
    mqttClient.loop();
    return;
  }

  if (WiFi.status() != WL_CONNECTED)
    return;
  if (millis() - mqttLastAttempt < MQTT_RETRY_MS)
    return;

  mqttLastAttempt = millis();
  if (mqttClient.connect(MQTT_CLIENT_ID, MQTT_STATUS_TOPIC, 0, true,
                         "offline")) {
    mqttClient.publish(MQTT_STATUS_TOPIC, "online", true);
  }
}

static void RunMqttTask(void *) {
  TelemetryPayload payload;
  for (;;) {
    KeepMqttAlive();

    if (xQueueReceive(mqttQueue, &payload, 0) == pdTRUE)
      mqttClient.publish(MQTT_TOPIC, payload.json);

    vTaskDelay(pdMS_TO_TICKS(MQTT_LOOP_MS));
  }
}

static void InitializeMqtt() {
  Serial.printf("MQTT init -> host: %s port: %d\\n", MQTT_HOST, MQTT_PORT);
  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  mqttClient.setSocketTimeout(MQTT_SOCKET_TIMEOUT_S);
  mqttClient.setBufferSize(MQTT_BUFFER_SIZE);

  mqttQueue = xQueueCreate(1, sizeof(TelemetryPayload));
  xTaskCreatePinnedToCore(RunMqttTask, "mqtt", MQTT_STACK_SIZE, nullptr,
                          MQTT_PRIORITY, &mqttHandle, MQTT_CORE);
}

static void SendTelemetry(const TelemetryPayload *payload) {
  xQueueOverwrite(mqttQueue, payload);
}

static void PrintMqtt() {
  Serial.printf("MQTT: %s | State: %d | Stack free: %u\n",
                IsMqttConnected() ? "connected" : "disconnected",
                mqttClient.state(),
                uxTaskGetStackHighWaterMark(mqttHandle));
}
