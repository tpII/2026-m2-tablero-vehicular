#include <Arduino.h>

#include "../config.h"

constexpr float HALL_WHEEL_RADIUS_M = 0.032f;
constexpr unsigned long HALL_MIN_PERIOD_US = 2000;
constexpr unsigned long HALL_TIMEOUT_US = 2000000;

static portMUX_TYPE hallMux = portMUX_INITIALIZER_UNLOCKED;
static volatile unsigned long hallLastUs;
static volatile unsigned long hallPeriodUs;
static volatile unsigned long hallPulses;

static void IRAM_ATTR OnHallPulse() {
  unsigned long now = micros();
  unsigned long elapsed = now - hallLastUs;
  if (elapsed < HALL_MIN_PERIOD_US) return;

  portENTER_CRITICAL_ISR(&hallMux);
  hallPeriodUs = elapsed < HALL_TIMEOUT_US ? elapsed : 0;
  hallLastUs = now;
  hallPulses++;
  portEXIT_CRITICAL_ISR(&hallMux);
}

static void InitializeHall() {
  pinMode(PIN_HALL, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(PIN_HALL), OnHallPulse, FALLING);
}

static unsigned long ReadHallPeriodUs() {
  portENTER_CRITICAL(&hallMux);
  unsigned long period = hallPeriodUs;
  unsigned long last = hallLastUs;
  portEXIT_CRITICAL(&hallMux);

  if (micros() - last > HALL_TIMEOUT_US) return 0;
  return period;
}

static float HallRpm(unsigned long periodUs) {
  if (periodUs == 0) return 0.0f;
  return 60000000.0f / periodUs;
}

static float HallAngularSpeed(unsigned long periodUs) {
  if (periodUs == 0) return 0.0f;
  return TWO_PI * 1000000.0f / periodUs;
}

static float HallTangentialSpeed(unsigned long periodUs) {
  return HallAngularSpeed(periodUs) * HALL_WHEEL_RADIUS_M;
}

static void PrintHall() {
  unsigned long periodUs = ReadHallPeriodUs();
  float speed = HallTangentialSpeed(periodUs);
  Serial.printf("Pulses: %lu | Period: %lu us | RPM: %7.1f | Speed: %.3f m/s | %.2f km/h\n", hallPulses, periodUs, HallRpm(periodUs), speed, speed * 3.6f);
}
