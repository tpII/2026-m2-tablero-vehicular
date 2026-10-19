#pragma once

#include <Arduino.h>
#include <freertos/FreeRTOS.h>
#include <freertos/queue.h>

#include "../Telemetria/Telemetria.h"

// Nucleo de sensores. Es el UNICO que lee o simula sensores y el UNICO que
// escribe en las colas. No sabe nada de WiFi ni de MQTT.
//
// Muestrea cada SENSOR_PERIOD_MS y deposita la lectura mas reciente con
// xQueueOverwrite en las dos colas: si el consumidor va lento se pierde el
// dato viejo, nunca el nuevo, y el productor jamas se bloquea.
//
// Cada cola es independiente y de longitud 1. El MQTT y la pantalla leen en
// paralelo sin interferirse, porque un xQueueOverwrite nunca espera a que
// haya espacio.
void sensoresInicia(QueueHandle_t salidaMqtt, QueueHandle_t salidaPantalla,
                    UBaseType_t nucleo);
