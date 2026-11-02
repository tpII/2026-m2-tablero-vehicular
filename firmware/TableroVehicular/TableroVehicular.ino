#include <Arduino.h>

#include "src/Encoder.cpp"
#include "src/Display.cpp"
#include "src/Motor.cpp"
#include "src/Ina219.cpp"
#include "src/Wifi.cpp"
#include "src/Mqtt.cpp"
#include "src/Hall.cpp"
#include "src/Task.cpp"

#include "config.h"

static float ReadPotentiometer() {
  return EncoderPercent(ReadEncoderRaw());
}

static float DriveMotor(float percent) {
  WriteMotorPercent(percent);
  return MotorPercent();
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

  InitializeTask(ReadPotentiometer, DriveMotor, ReadIna219Milliamps, ReadIna219Milliwatts);
}

void loop() {
  KeepMqttAlive();

  TaskReading reading;
  if (!ReceiveTask(&reading)) return;

  ShowDisplayPercent(reading.potentiometer);

  unsigned long periodUs = ReadHallPeriodUs();
  char payload[128];
  snprintf(payload, sizeof(payload), "{\"potentiometer\":%.1f,\"motorPwm\":%.1f,\"rpm\":%.1f,\"speed\":%.2f,\"current\":%.1f,\"power\":%.1f}", reading.potentiometer, reading.motor, HallRpm(periodUs), HallTangentialSpeed(periodUs) * 3.6f, reading.current, reading.power);
  PublishMqtt(MQTT_TOPIC, payload);

  PrintTask();
  PrintHall();
//  PrintWifi();
//  PrintMqtt();
//  PublishMqtt("vehicle/m2/test", "hello from the dashboard");
}
