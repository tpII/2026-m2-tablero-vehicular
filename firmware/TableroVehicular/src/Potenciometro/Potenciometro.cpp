#include "Potenciometro.h"

#include "../../config.h"

// Factor del suavizado exponencial: mas bajo = mas estable pero mas lento.
static const float SUAVIZADO = 0.15f;
static float valorSuavizado = 0.0f;

static float limita(float valor, float min, float max) {
  if (valor < min) return min;
  if (valor > max) return max;
  return valor;
}

void potenciometroInicia() {
  analogReadResolution(POTENCIOMETRO_RESOLUCION_BITS);
  analogSetPinAttenuation(PIN_POTENCIOMETRO, ADC_11db);
}

int potenciometroLeeCrudo() {
  return analogRead(PIN_POTENCIOMETRO);
}

float potenciometroLeePorcentaje() {
  float porcentaje =
      (potenciometroLeeCrudo() * 100.0f) / POTENCIOMETRO_FONDO_ESCALA;

  if (valorSuavizado == 0.0f) {
    valorSuavizado = porcentaje;
  } else {
    valorSuavizado += (porcentaje - valorSuavizado) * SUAVIZADO;
  }

  return limita(valorSuavizado, 0.0f, 100.0f);
}