#include <Arduino.h>

#include "src/Encoder.cpp"
#include "src/Display.cpp"
#include "src/Motor.cpp"
#include "src/Ina219.cpp"
#include "src/Wifi.cpp"
#include "src/Mqtt.cpp"
#include "src/Hall.cpp"
#include "src/Utils.cpp"

#include "config.h"

struct Telemetry {
  float potentiometer;
  float motor;
  float current;
  float power;
};

static QueueHandle_t telemetryQueue;
static QueueHandle_t mqttQueue;
static TaskHandle_t controlTask;
static TaskHandle_t mqttTask;

static void RunControl(void *) {
  Telemetry telemetry;
  for (;;) {
    telemetry.potentiometer = EncoderPercent(ReadEncoderRaw());
    WriteMotorPercent(telemetry.potentiometer);
    telemetry.motor = MotorPercent();
    telemetry.current = ReadIna219Milliamps();
    telemetry.power = ReadIna219Milliwatts();
    xQueueOverwrite(telemetryQueue, &telemetry);
    vTaskDelay(pdMS_TO_TICKS(CONTROL_TASK_PERIOD_MS));
  }
}

static void RunMqtt(void *) {
  char payload[MQTT_PAYLOAD_SIZE];
  for (;;) {
    KeepMqttAlive();
    if (xQueueReceive(mqttQueue, payload, pdMS_TO_TICKS(MQTT_TASK_PERIOD_MS)) == pdTRUE) PublishMqtt(MQTT_TOPIC, payload);
  }
}

static void PrintControl(const Telemetry &telemetry) {
  Serial.printf("Potentiometer: %5.1f %% | Motor: %5.1f %% | Stack free: %u\n", telemetry.potentiometer, telemetry.motor, uxTaskGetStackHighWaterMark(controlTask));
}

static void PrintMqttTask() {
  Serial.printf("MQTT task stack free: %u\n", uxTaskGetStackHighWaterMark(mqttTask));
}

void setup() {
  Serial.begin(115200);
  unsigned long start = millis();
  while (!Serial && millis() - start < 2000) {
  }

  InitializeEncoder();
  InitializeDisplay(0);
  InitializeMotor();
  InitializeHall();
  if (!InitializeIna219()) Serial.println("INA219 not found");
//
//  DrawDisplayTest();
//  delay(1000);
//  ClearDisplay();
//  PrintDisplay();
//
  InitializeWifi();
  InitializeMqtt();

  telemetryQueue = xQueueCreate(1, sizeof(Telemetry));
  mqttQueue = xQueueCreate(1, MQTT_PAYLOAD_SIZE);
  xTaskCreatePinnedToCore(RunControl, "control", CONTROL_TASK_STACK, nullptr, CONTROL_TASK_PRIORITY, &controlTask, CONTROL_TASK_CORE);
  xTaskCreatePinnedToCore(RunMqtt, "mqtt", MQTT_TASK_STACK, nullptr, MQTT_TASK_PRIORITY, &mqttTask, MQTT_TASK_CORE);
}

void loop() {
  Telemetry telemetry;
  if (xQueueReceive(telemetryQueue, &telemetry, pdMS_TO_TICKS(CONTROL_TASK_PERIOD_MS)) != pdTRUE) return;

  ShowDisplayPercent(telemetry.potentiometer);

  unsigned long periodUs = ReadHallPeriodUs();
  char payload[MQTT_PAYLOAD_SIZE] = "";
  AddJson(payload, sizeof(payload), "potentiometer", telemetry.potentiometer, 1);
  AddJson(payload, sizeof(payload), "motorPwm", telemetry.motor, 1);
  AddJson(payload, sizeof(payload), "rpm", HallRpm(periodUs), 1);
  AddJson(payload, sizeof(payload), "speed", HallTangentialSpeed(periodUs) * 3.6f, 2);
  AddJson(payload, sizeof(payload), "current", telemetry.current, 1);
  AddJson(payload, sizeof(payload), "power", telemetry.power, 1);
  CloseJson(payload, sizeof(payload));
  xQueueOverwrite(mqttQueue, payload);

  PrintControl(telemetry);
  PrintHall();
  PrintMqttTask();
//  PrintWifi();
//  PrintMqtt();
//  PublishMqtt("vehicle/m2/test", "hello from the dashboard");
}
