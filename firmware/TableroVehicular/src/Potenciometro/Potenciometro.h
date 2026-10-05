#pragma once

#include <Arduino.h>

#define POTENCIOMETRO_RESOLUCION_BITS 12
#define POTENCIOMETRO_FONDO_ESCALA     4095

// Configura la resolucion del ADC y la atenuacion del pin.
void potenciometroInicia();

// Lectura cruda del ADC (0 - 4095 con 12 bits).
int potenciometroLeeCrudo();

// Lectura normalizada a porcentaje (0.0 - 100.0) con suavizado exponencial
// para que el valor no salte por el ruido del ADC.
float potenciometroLeePorcentaje();