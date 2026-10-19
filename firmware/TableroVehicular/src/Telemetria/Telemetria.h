#pragma once

#include <Arduino.h>

// Contrato unico entre el nucleo de sensores y el de comunicaciones.
// Viaja por la cola: nadie mas la toca, asi que no hace falta mutex.
struct Telemetry {
  float velocidad;      // km/h
  float rpm;            // rev/min
  float maxRpm;         // tope de la escala del tacometro
  float potenciometro;  // 0 - 100
  float bateria;        // voltios
};
