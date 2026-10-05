#include "Sensores.h"

#include "../../config.h"
#include "../Potenciometro/Potenciometro.h"

namespace {

QueueHandle_t colaMqtt = nullptr;
QueueHandle_t colaPantalla = nullptr;

// Estado de la simulacion. Vive solo en este nucleo.
float velocidad = 0;
float velocidadObjetivo = 0;
float potenciometro = 0;
float bateria = 12.6;

unsigned long ultimaMuestra = 0;
unsigned long proximoEscenario = 0;

float limita(float valor, float min, float max) {
  if (valor < min) return min;
  if (valor > max) return max;
  return valor;
}

float acerca(float actual, float objetivo, float factor) {
  return actual + (objetivo - actual) * factor;
}

// Sierra calada por marcha: sube dentro de cada marcha y cae al cambiar
float calculaRpm(float kmh) {
  const float velMax = 140.0f;
  const int marches = 6;
  const float ralenti = 800.0f;

  float posicion = limita(kmh / velMax, 0.0f, 1.0f) / (1.0f / marches);
  int marcha = constrain((int)posicion, 0, marches - 1);
  float dentro = (posicion - marcha) * 0.88f;

  return ralenti + dentro * (MAX_RPM - ralenti);
}

// El unico punto donde habra que sustituir la simulacion por lecturas reales:
// aqui se decide el valor de cada sensor que sale hacia MQTT.
void tomaLectura(unsigned long ahora, Telemetry* lectura) {
  float segundos = ultimaMuestra == 0 ? 0.0f : (ahora - ultimaMuestra) / 1000.0f;
  ultimaMuestra = ahora;

  if (ahora >= proximoEscenario) {
    proximoEscenario = ahora + 4000 + random(6000);
    velocidadObjetivo = random(0, 131);
  }

  velocidad = acerca(velocidad, velocidadObjetivo, 0.06f);

#if USAR_POTENCIOMETRO_REAL
  // El acelerador real manda; el resto sigue simulado
  float acelerador = potenciometroLeePorcentaje();
#else
  // El acelerador responde a la diferencia entre velocidad deseada y real
  float acelerador = limita((velocidadObjetivo - velocidad) * 7.0f, 0.0f, 100.0f);
  if (velocidadObjetivo < velocidad) acelerador = 0;
#endif

  potenciometro = acerca(potenciometro, acelerador, 0.12f);

  // El alternador recarga por encima de 3000 rpm y consume el resto
  if (calculaRpm(velocidad) > 3000) {
    bateria = limita(bateria + 0.004f * segundos, 11.8f, 14.4f);
  } else {
    bateria = limita(bateria - 0.00008f * segundos, 11.8f, 14.4f);
  }

  lectura->velocidad = velocidad;
  lectura->rpm = calculaRpm(velocidad);
  lectura->maxRpm = (float)MAX_RPM;
  lectura->potenciometro = potenciometro;
  lectura->bateria = bateria;
}

void tareaSensores(void* parametro) {
  (void)parametro;

#if USAR_POTENCIOMETRO_REAL
  potenciometroInicia();
#endif

  Telemetry lectura;

  for (;;) {
    unsigned long ahora = millis();
    tomaLectura(ahora, &lectura);

    // Overwrite, no send: el ultimo dato siempre gana y nunca esperamos.
    // Dos colas independientes para que la pantalla no le robe lecturas al
    // MQTT; como ambas son de longitud 1, ninguno de los dos puede bloquear.
    xQueueOverwrite(colaMqtt, &lectura);
    xQueueOverwrite(colaPantalla, &lectura);

    vTaskDelay(pdMS_TO_TICKS(SENSOR_PERIOD_MS));
  }
}

}  // namespace

void sensoresInicia(QueueHandle_t salidaMqtt, QueueHandle_t salidaPantalla,
                    UBaseType_t nucleo) {
  colaMqtt = salidaMqtt;
  colaPantalla = salidaPantalla;

  randomSeed(esp_random());

  xTaskCreatePinnedToCore(tareaSensores, "sensores", 4096, nullptr,
                          PRIORIDAD_SENSORES, nullptr, nucleo);

  Serial.printf("[sensores] nucleo %d, muestreo cada %d ms, pot real %d\n",
                nucleo, SENSOR_PERIOD_MS, USAR_POTENCIOMETRO_REAL);
}
