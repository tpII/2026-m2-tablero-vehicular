#pragma once

#include <Arduino.h>

#define MOTOR_PWM_CANAL           0
#define MOTOR_PWM_FRECUENCIA_HZ   1000
#define MOTOR_PWM_RESOLUCION_BITS 8
#define MOTOR_PWM_FONDO_ESCALA    255

// Configura el canal PWM (LEDC) en PIN_MOTOR_IN1 y deja el motor detenido.
void motorInicia();

// Escala el porcentaje del acelerador/potenciometro (0.0 - 100.0) al rango
// de PWM (0 - 255) y actualiza la salida hacia IN1 del L298N.
void motorEscribePorcentaje(float porcentaje);
