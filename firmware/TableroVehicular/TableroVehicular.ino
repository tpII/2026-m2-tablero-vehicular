#include <Arduino.h>
#include <math.h>

#include "src/Encoder.cpp"
#include "src/Display.cpp"
#include "src/Motor.cpp"
#include "src/Ina219.cpp"
#include "src/Wifi.cpp"
#include "src/Mqtt.cpp"
#include "src/Hall.cpp"
#include "src/Task.cpp"

#include "config.h"

static void FormatJsonFloat(float value, char *buffer, size_t bufferSize, const char *format) {
  if (!isfinite(value)) {
    snprintf(buffer, bufferSize, "null");
    return;
  }

  snprintf(buffer, bufferSize, format, static_cast<double>(value));
}

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
  TaskReading reading;
  if (!ReceiveTask(&reading)) return;

  ShowDisplayPercent(reading.potentiometer);

  unsigned long periodUs = ReadHallPeriodUs();
  char potentiometer[48];
  char motorPwm[48];
  char rpm[48];
  char speed[48];
  char current[48];
  char power[48];
  FormatJsonFloat(reading.potentiometer, potentiometer, sizeof(potentiometer), "%.1f");
  FormatJsonFloat(reading.motor, motorPwm, sizeof(motorPwm), "%.1f");
  FormatJsonFloat(HallRpm(periodUs), rpm, sizeof(rpm), "%.1f");
  FormatJsonFloat(HallTangentialSpeed(periodUs), speed, sizeof(speed), "%.2f");
  FormatJsonFloat(reading.current, current, sizeof(current), "%.1f");
  FormatJsonFloat(reading.power, power, sizeof(power), "%.1f");

  static TelemetryPayload payload;
  snprintf(payload.json, sizeof(payload.json), "{\"potentiometer\":%s,\"motorPwm\":%s,\"rpm\":%s,\"speed\":%s,\"current\":%s,\"power\":%s}", potentiometer, motorPwm, rpm, speed, current, power);
  SendTelemetry(&payload);

  PrintTask();
  PrintHall();
  PrintWifi();
  PrintMqtt();
//  PublishMqtt("vehicle/m2/test", "hello from the dashboard");
}
