#include <Arduino.h>

#include "src/Encoder.cpp"
#include "src/Display.cpp"
#include "src/Motor.cpp"
#include "src/Ina219.cpp"
#include "src/Wifi.cpp"
#include "src/Mqtt.cpp"
#include "src/Hall.cpp"

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
//  InitializeWifi();
//  InitializeMqtt();
}

void loop() {
  float percent = EncoderPercent(ReadEncoderRaw());
  ShowDisplayPercent(percent);
  WriteMotorPercent(percent);

  PrintEncoder();
  PrintMotor();
  PrintIna219();
  PrintHall();
//  KeepMqttAlive();
//  PrintWifi();
//  PrintMqtt();
//  PublishMqtt("vehicle/m2/test", "hello from the dashboard");
//  delay(1000);

  delay(200);
}
