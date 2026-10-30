#include "INA219.h"

#include <Adafruit_INA219.h>
#include <Wire.h>
#include <math.h>

namespace {

constexpr uint8_t PIN_INA219_SDA = 21;
constexpr uint8_t PIN_INA219_SCL = 22;

Adafruit_INA219 sensor;
bool sensorListo = false;

}  // namespace

bool ina219Inicia() {
  Wire.begin(PIN_INA219_SDA, PIN_INA219_SCL);

  if (!sensor.begin(&Wire)) {
    sensorListo = false;
    Serial.println("[ina219] no detectado; revisar alimentacion y bus I2C");
    return false;
  }

  sensor.setCalibration_32V_2A();
  sensorListo = true;
  Serial.println("[ina219] listo, calibracion 32V/2A");
  return true;
}

bool ina219Lee(INA219Medicion* medicion) {
  if (!sensorListo || medicion == nullptr) {
    return false;
  }

  const float tensionBus = sensor.getBusVoltage_V();
  const float tensionShunt = sensor.getShuntVoltage_mV() / 1000.0f;
  const float corriente = sensor.getCurrent_mA() / 1000.0f;
  const float potencia = sensor.getPower_mW() / 1000.0f;
  const float tensionCarga = tensionBus + tensionShunt;

  if (!isfinite(corriente) || !isfinite(tensionCarga) ||
      !isfinite(potencia)) {
    return false;
  }

  medicion->corrienteA = corriente;
  medicion->tensionCargaV = tensionCarga;
  medicion->potenciaW = potencia;
  return true;
}
