#include <Arduino.h>

#include "src/Encoder.cpp"
#include "src/Display.cpp"
#include "src/Motor.cpp"
#include "src/Ina219.cpp"
#include "src/Wifi.cpp"
#include "src/Mqtt.cpp"
#include "src/Hall.cpp"

#include "config.h"

struct Telemetry {
  float potentiometer;
  float motor;
  float current;
  float power;
};

static QueueHandle_t telemetryQueue;
static TaskHandle_t controlTask;

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

static void PrintControl(const Telemetry &telemetry) {
  Serial.printf("Potentiometer: %5.1f %% | Motor: %5.1f %% | Stack free: %u\n", telemetry.potentiometer, telemetry.motor, uxTaskGetStackHighWaterMark(controlTask));
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
  xTaskCreatePinnedToCore(RunControl, "control", CONTROL_TASK_STACK, nullptr, CONTROL_TASK_PRIORITY, &controlTask, CONTROL_TASK_CORE);
}

void loop() {
  KeepMqttAlive();

  Telemetry telemetry;
  if (xQueueReceive(telemetryQueue, &telemetry, pdMS_TO_TICKS(CONTROL_TASK_PERIOD_MS)) != pdTRUE) return;

  ShowDisplayPercent(telemetry.potentiometer);

  unsigned long periodUs = ReadHallPeriodUs();
  char payload[128];
  snprintf(payload, sizeof(payload), "{\"potentiometer\":%.1f,\"motorPwm\":%.1f,\"rpm\":%.1f,\"speed\":%.2f,\"current\":%.1f,\"power\":%.1f}", telemetry.potentiometer, telemetry.motor, HallRpm(periodUs), HallTangentialSpeed(periodUs) * 3.6f, telemetry.current, telemetry.power);
  PublishMqtt(MQTT_TOPIC, payload);

  PrintControl(telemetry);
  PrintHall();
//  PrintWifi();
//  PrintMqtt();
//  PublishMqtt("vehicle/m2/test", "hello from the dashboard");
}
