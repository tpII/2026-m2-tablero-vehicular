#pragma once

#include <Arduino.h>

struct INA219Medicion {
  float corrienteA;
  float tensionCargaV;
  float potenciaW;
};

// Inicializa el INA219 por I2C en SDA 21 / SCL 22.
bool ina219Inicia();

// Lee corriente, tension en la carga y potencia. Devuelve false si el sensor
// no esta listo o alguna lectura no es valida.
bool ina219Lee(INA219Medicion* medicion);
