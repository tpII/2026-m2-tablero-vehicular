#include <Arduino.h>
#include <Adafruit_INA219.h>
#include <Wire.h>

#include "../config.h"

static Adafruit_INA219 ina219;

static bool InitializeIna219() {
  Wire.begin(PIN_INA219_SDA, PIN_INA219_SCL);
  if (!ina219.begin(&Wire)) return false;
  ina219.setCalibration_32V_2A();
  return true;
}

static float ReadIna219BusVolts() {
  return ina219.getBusVoltage_V();
}

static float ReadIna219ShuntMillivolts() {
  return ina219.getShuntVoltage_mV();
}

static float ReadIna219Milliamps() {
  return ina219.getCurrent_mA();
}

static float ReadIna219Milliwatts() {
  return ina219.getPower_mW();
}

static float Ina219LoadVolts(float busVolts, float shuntMillivolts) {
  return busVolts + shuntMillivolts / 1000.0f;
}

static void PrintIna219() {
  float busVolts = ReadIna219BusVolts();
  float shuntMillivolts = ReadIna219ShuntMillivolts();
  Serial.printf("Bus: %.3f V | Shunt: %.3f mV | Load: %.3f V | Current: %.3f mA | Power: %.3f mW\n", busVolts, shuntMillivolts, Ina219LoadVolts(busVolts, shuntMillivolts), ReadIna219Milliamps(), ReadIna219Milliwatts());
}
