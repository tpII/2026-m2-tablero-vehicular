#include "Motor.h"

#include "../../config.h"

namespace {

float limita(float valor, float min, float max) {
  if (valor < min) return min;
  if (valor > max) return max;
  return valor;
}

void escribeDuty(int duty) {
  int acotado = constrain(duty, 0, MOTOR_PWM_FONDO_ESCALA);
#if defined(ESP_ARDUINO_VERSION_MAJOR) && ESP_ARDUINO_VERSION_MAJOR >= 3
  ledcWrite(PIN_MOTOR_IN1, acotado);
#else
  ledcWrite(MOTOR_PWM_CANAL, acotado);
#endif
}

}  // namespace

void motorInicia() {
#if defined(ESP_ARDUINO_VERSION_MAJOR) && ESP_ARDUINO_VERSION_MAJOR >= 3
  ledcAttach(PIN_MOTOR_IN1, MOTOR_PWM_FRECUENCIA_HZ, MOTOR_PWM_RESOLUCION_BITS);
#else
  ledcSetup(MOTOR_PWM_CANAL, MOTOR_PWM_FRECUENCIA_HZ, MOTOR_PWM_RESOLUCION_BITS);
  ledcAttachPin(PIN_MOTOR_IN1, MOTOR_PWM_CANAL);
#endif
  escribeDuty(0);
}

void motorEscribePorcentaje(float porcentaje) {
  float acotado = limita(porcentaje, 0.0f, 100.0f);
  int duty = (int)((acotado * MOTOR_PWM_FONDO_ESCALA) / 100.0f + 0.5f);
  escribeDuty(duty);
}
