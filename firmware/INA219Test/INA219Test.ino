#include <Adafruit_INA219.h>
#include <Wire.h>

constexpr uint8_t PIN_SDA = 21;
constexpr uint8_t PIN_SCL = 22;

Adafruit_INA219 ina219;

void setup() {
  Serial.begin(115200);
  delay(500);

  Wire.begin(PIN_SDA, PIN_SCL);

  if (!ina219.begin(&Wire)) {
    Serial.println("No se detecto el INA219. Revisa alimentacion y conexiones I2C.");
    while (true) {
      delay(1000);
    }
  }

  ina219.setCalibration_32V_2A();
  Serial.println("INA219 listo. Lecturas cada segundo:");
}

void loop() {
  const float busVoltage = ina219.getBusVoltage_V();
  const float shuntVoltage = ina219.getShuntVoltage_mV();
  const float current = ina219.getCurrent_mA();
  const float power = ina219.getPower_mW();
  const float loadVoltage = busVoltage + shuntVoltage / 1000.0f;

  Serial.printf(
      "Bus: %.3f V | Shunt: %.3f mV | Carga: %.3f V | Corriente: %.3f mA | Potencia: %.3f mW\n",
      busVoltage, shuntVoltage, loadVoltage, current, power);

  delay(1000);
}
