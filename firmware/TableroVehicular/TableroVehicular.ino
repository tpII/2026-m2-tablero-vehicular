/*
  Example animated analogue meters

  Needs Font 2 (also Font 4 if using large scale label)

  Make sure all the display driver and pin connections are correct by
  editing the User_Setup.h file in the TFT_eSPI library folder.

  #########################################################################
  ###### DON'T FORGET TO UPDATE THE User_Setup.h FILE IN THE LIBRARY ######
  #########################################################################

  Requires widget library here:
  https://github.com/Bodmer/TFT_eWidget
*/

// Librerias locales en src/ (el IDE compila src/ automaticamente)
#include "config.h"
#include "src/Potenciometro/Potenciometro.h"
#include "src/TFT_eSPI/TFT_eSPI.h"    // Hardware-specific library
#include "src/TFT_eSPI/TFT_eWidget.h" // Widget library

TFT_eSPI tft = TFT_eSPI(); // Invoke custom library

MeterWidget amps = MeterWidget(&tft);
MeterWidget volts = MeterWidget(&tft);
MeterWidget ohms = MeterWidget(&tft);

#define LOOP_PERIOD 35 // Display updates every 35 ms

void setup(void) {
  potenciometroInicia();
  tft.init();
  tft.setRotation(0);
  Serial.begin(115200); // For debug

  Serial.printf("[pot] pin %d, ADC %d bits\n", PIN_POTENCIOMETRO,
                POTENCIOMETRO_RESOLUCION_BITS);

  // Colour zones are set as a start and end percentage of full scale (0-100)
  // If start and end of a colour zone are the same then that colour is not used
  //            --Red--  -Org-   -Yell-  -Grn-
  amps.setZones(
      75, 100, 50, 75, 25, 50, 0,
      25); // Example here red starts at 75% and ends at 100% of full scale
  // Meter es 239 pixels wide and 126 pixels high
  // El 3er parametro es el fondo de escala: Meter.cpp calcula
  // factor = 100/fullScale, asi que con 100 el valor va directo a la aguja.
  amps.analogMeter(0, 0, 100.0, "%", "0", "25", "50", "75",
                   "100"); // Draw analogue meter at 0, 0

  // Colour draw order is red, orange, yellow, green. So red can be full scale
  // with green drawn last on top to indicate a "safe" zone.
  //             -Red-   -Org-  -Yell-  -Grn-
  volts.setZones(0, 100, 25, 75, 0, 0, 40, 60);
  volts.analogMeter(0, 128, 10.0, "V", "0", "2.5", "5", "7.5",
                    "10"); // Draw analogue meter at 0, 128

  // No coloured zones if not defined
  ohms.analogMeter(0, 256, 100, "R", "0", "", "50", "",
                   "100"); // Draw analogue meter at 0, 128
}

void loop() {

  static int d = 0;
  static uint32_t updateTime = 0;

  if (millis() - updateTime >= LOOP_PERIOD) {
    updateTime = millis();

    d += 4;
    if (d > 360)
      d = 0;

    // Create a Sine wave for testing, value is in range 0 - 100
    float value = 50.0 + 50.0 * sin((d + 0) * 0.0174532925);

    // La aguja superior marca el potenciometro real: escala 0 - 100
    float porcentaje = potenciometroLeePorcentaje();
    Serial.printf("Potenciometro: %.1f%%\n", porcentaje);
    amps.updateNeedle(porcentaje, 0);

    float voltage;
    voltage =
        mapValue(value, (float)0.0, (float)100.0, (float)0.0, (float)10.0);
    // Serial.print(", V = "); Serial.println(voltage);
    volts.updateNeedle(voltage, 0);

    float resistance;
    resistance =
        mapValue(value, (float)0.0, (float)100.0, (float)0.0, (float)100.0);
    // Serial.print(", R = "); Serial.println(resistance);
    ohms.updateNeedle(resistance, 0);
  }
}

float mapValue(float ip, float ipmin, float ipmax, float tomin, float tomax) {
  return tomin + (((tomax - tomin) * (ip - ipmin)) / (ipmax - ipmin));
}
