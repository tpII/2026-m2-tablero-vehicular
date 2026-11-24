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
  float rpm;
  float speed;
  float current;
  float power;
};

static QueueHandle_t telemetryQueue;
static TaskHandle_t controlTask;
static TaskHandle_t displayTask;
static TaskHandle_t mqttTask;
static TaskHandle_t monitorTask;

static void BuildTelemetryJson(const Telemetry &telemetry, char *payload, size_t size) {
  payload[0] = '\0';
  AddJson(payload, size, "potentiometer", telemetry.potentiometer, 1);
  AddJson(payload, size, "motorPwm", telemetry.motor, 1);
  AddJson(payload, size, "rpm", telemetry.rpm, 1);
  AddJson(payload, size, "speed", telemetry.speed, 2);
  AddJson(payload, size, "current", telemetry.current, 1);
  AddJson(payload, size, "power", telemetry.power, 1);
  CloseJson(payload, size);
}

static void RunControl(void *) {
  Telemetry telemetry;
  TickType_t lastWake = xTaskGetTickCount();
  for (;;) {
    telemetry.potentiometer = EncoderPercent(ReadEncoderRaw());
    WriteMotorPercent(MotorStartScale(telemetry.potentiometer));
    telemetry.motor = MotorPercent();
    unsigned long periodUs = ReadHallPeriodUs();
    telemetry.rpm = HallRpm(periodUs);
    telemetry.speed = HallTangentialSpeed(periodUs);
    telemetry.current = ReadIna219Milliamps();
    telemetry.power = ReadIna219Milliwatts();
    xQueueOverwrite(telemetryQueue, &telemetry);
    vTaskDelayUntil(&lastWake, pdMS_TO_TICKS(CONTROL_TASK_PERIOD_MS));
  }
}

static void RunDisplay(void *) {
  Telemetry telemetry;
  TickType_t lastWake = xTaskGetTickCount();
  for (;;) {
    if (xQueuePeek(telemetryQueue, &telemetry, 0) == pdTRUE) {
      UpdateDisplayCycle();
      ShowDisplayGauges(telemetry.motor, telemetry.speed, telemetry.current);
    }
    vTaskDelayUntil(&lastWake, pdMS_TO_TICKS(DISPLAY_TASK_PERIOD_MS));
  }
}

static void RunMqtt(void *) {
  Telemetry telemetry;
  char payload[MQTT_PAYLOAD_SIZE];
  TickType_t lastWake = xTaskGetTickCount();
  for (;;) {
    KeepMqttAlive();
    if (xQueuePeek(telemetryQueue, &telemetry, 0) == pdTRUE) {
      BuildTelemetryJson(telemetry, payload, sizeof(payload));
      PublishMqtt(MQTT_TOPIC, payload);
    }
    vTaskDelayUntil(&lastWake, pdMS_TO_TICKS(MQTT_TASK_PERIOD_MS));
  }
}

static void PrintControl(const Telemetry &telemetry) {
  Serial.printf("Potentiometer: %5.1f %% | Motor: %5.1f %% | Stack free: %u\n", telemetry.potentiometer, telemetry.motor, uxTaskGetStackHighWaterMark(controlTask));
}

static void PrintDisplayTask() {
  Serial.printf("Display task stack free: %u\n", uxTaskGetStackHighWaterMark(displayTask));
}

static void PrintMqttTask() {
  Serial.printf("MQTT task stack free: %u\n", uxTaskGetStackHighWaterMark(mqttTask));
}

static void RunMonitor(void *) {
  Telemetry telemetry;
  TickType_t lastWake = xTaskGetTickCount();
  for (;;) {
    if (xQueuePeek(telemetryQueue, &telemetry, 0) == pdTRUE) PrintControl(telemetry);
    PrintHall();
    PrintDisplayTask();
    PrintMqttTask();
//    PrintWifi();
//    PrintMqtt();
    vTaskDelayUntil(&lastWake, pdMS_TO_TICKS(MONITOR_TASK_PERIOD_MS));
  }
}

void setup() {
  Serial.begin(115200);
  unsigned long start = millis();
  while (!Serial && millis() - start < 2000) {
  }

  InitializeEncoder();
  InitializeDisplay(DISPLAY_ROTATION);
  ShowGauge(GAUGE_PWM);
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
  xTaskCreatePinnedToCore(RunControl, "control", CONTROL_TASK_STACK, nullptr, CONTROL_TASK_PRIORITY, &controlTask, CONTROL_TASK_CORE);
  xTaskCreatePinnedToCore(RunDisplay, "display", DISPLAY_TASK_STACK, nullptr, DISPLAY_TASK_PRIORITY, &displayTask, DISPLAY_TASK_CORE);
  xTaskCreatePinnedToCore(RunMqtt, "mqtt", MQTT_TASK_STACK, nullptr, MQTT_TASK_PRIORITY, &mqttTask, MQTT_TASK_CORE);
//  xTaskCreatePinnedToCore(RunMonitor, "monitor", MONITOR_TASK_STACK, nullptr, MONITOR_TASK_PRIORITY, &monitorTask, MONITOR_TASK_CORE);
}

void loop() {
  vTaskDelete(nullptr);
}
