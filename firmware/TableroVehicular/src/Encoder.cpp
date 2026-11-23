#include <Arduino.h>

#include "../config.h"

constexpr uint8_t ENCODER_RESOLUTION_BITS = 12;
constexpr float ENCODER_FULL_SCALE = 4095.0f;
constexpr float ENCODER_VREF = 3.3f;

static void InitializeEncoder() {
  analogReadResolution(ENCODER_RESOLUTION_BITS);
  analogSetPinAttenuation(PIN_ENCODER, ADC_11db);
}

static int ReadEncoderRaw() {
  return analogRead(PIN_ENCODER);
}

static float EncoderPercent(int raw) {
  return (raw * 100.0f) / ENCODER_FULL_SCALE;
}

static float EncoderVolts(int raw) {
  return (raw * ENCODER_VREF) / ENCODER_FULL_SCALE;
}

static void PrintEncoder() {
  int raw = ReadEncoderRaw();
  Serial.printf("Raw: %4d | Voltage: %.2f V | Percent: %5.1f %%\n", raw, EncoderVolts(raw), EncoderPercent(raw));
}
