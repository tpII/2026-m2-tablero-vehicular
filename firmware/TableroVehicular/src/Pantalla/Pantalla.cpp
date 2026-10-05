#include "Pantalla.h"

#include "../../config.h"
#include "../TFT_eSPI/TFT_eSPI.h"
#include "../TFT_eSPI/TFT_eWidget.h"

namespace {

QueueHandle_t colaEntrada = nullptr;

// Solo esta tarea los usa, asi que no hace falta mutex.
// Declaracion identica a la del ejemplo que sabemos que funciona.
TFT_eSPI tft = TFT_eSPI(); // Invoke custom library

MeterWidget amps = MeterWidget(&tft);
MeterWidget volts = MeterWidget(&tft);
MeterWidget ohms = MeterWidget(&tft);

const uint32_t LOOP_PERIOD = 35; // Display updates every 35 ms

float mapValue(float ip, float ipmin, float ipmax, float tomin, float tomax) {
  return tomin + (((tomax - tomin) * (ip - ipmin)) / (ipmax - ipmin));
}

void tareaPantalla(void *parametro) {
  (void)parametro;

  // ---- Equivalente exacto del setup() del ejemplo ----
  tft.init();
  tft.setRotation(0);

  // Colour zones are set as a start and end percentage of full scale (0-100)
  // If start and end of a colour zone are the same then that colour is not used
  //            --Red--  -Org-   -Yell-  -Grn-
  amps.setZones(75, 100, 50, 75, 25, 50, 0, 25);
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
                   "100"); // Draw analogue meter at 0, 256

  // ---- Equivalente del loop() del ejemplo ----
  int d = 0;
  uint32_t updateTime = 0;
  float porcentaje = 0; // ultima lectura del potenciometro recibida por cola

  for (;;) {
    // En vez de leer el ADC aqui, se toma el potenciometro de la cola.
    Telemetry nueva;
    if (xQueueReceive(colaEntrada, &nueva, 0) == pdTRUE) {
      porcentaje = nueva.potenciometro;
    }

    if (millis() - updateTime >= LOOP_PERIOD) {
      updateTime = millis();

      d += 4;
      if (d > 360)
        d = 0;

      // Create a Sine wave for testing, value is in range 0 - 100
      float value = 50.0 + 50.0 * sin((d + 0) * 0.0174532925);

      // La aguja superior marca el potenciometro real: escala 0 - 100
      Serial.printf("Potenciometro: %.1f%%\n", porcentaje);
      amps.updateNeedle(porcentaje, 0);

      float voltage;
      voltage =
          mapValue(value, (float)0.0, (float)100.0, (float)0.0, (float)10.0);
      volts.updateNeedle(voltage, 0);

      float resistance;
      resistance =
          mapValue(value, (float)0.0, (float)100.0, (float)0.0, (float)100.0);
      ohms.updateNeedle(resistance, 0);
    }

    vTaskDelay(pdMS_TO_TICKS(5));
  }
}

} // namespace

void pantallaInicia(QueueHandle_t entrada, UBaseType_t nucleo) {
  colaEntrada = entrada;

  xTaskCreatePinnedToCore(tareaPantalla, "pantalla", 8192, nullptr,
                          PRIORIDAD_PANTALLA, nullptr, nucleo);

  Serial.printf("[pantalla] nucleo %d, refresco cada %d ms, %dx%d\n", nucleo,
                (int)LOOP_PERIOD, TFT_WIDTH, TFT_HEIGHT);
}
