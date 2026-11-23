#include <Arduino.h>

#include "../config.h"

constexpr uint32_t MOTOR_PWM_FREQUENCY_HZ = 1000;
constexpr uint8_t MOTOR_PWM_RESOLUTION_BITS = 8;
constexpr float MOTOR_FULL_SCALE = 255.0f;

static int motorDuty;

static void WriteMotorPercent(float percent) {
  motorDuty = constrain(percent, 0.0f, 100.0f) * MOTOR_FULL_SCALE / 100.0f + 0.5f;
  ledcWrite(PIN_MOTOR_IN1, motorDuty);
}

static void StopMotor() {
  WriteMotorPercent(0.0f);
}

static void InitializeMotor() {
  ledcAttach(PIN_MOTOR_IN1, MOTOR_PWM_FREQUENCY_HZ, MOTOR_PWM_RESOLUTION_BITS);
  StopMotor();
}

static float MotorPercent() {
  return motorDuty * 100.0f / MOTOR_FULL_SCALE;
}

static void PrintMotor() {
  Serial.printf("Duty: %3d | Motor: %5.1f %%\n", motorDuty, MotorPercent());
}
