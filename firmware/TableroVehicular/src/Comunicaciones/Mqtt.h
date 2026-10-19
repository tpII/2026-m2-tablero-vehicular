#pragma once

#include <Arduino.h>
#include <freertos/FreeRTOS.h>
#include <freertos/queue.h>

#include "../Telemetria/Telemetria.h"

// Nucleo de comunicaciones. Es el UNICO que toca WiFi y PubSubClient, porque
// ambos son sensibles al hilo: el stack de red vive en el core de Arduino y
// dos tareas compartiendo el mismo socket producirian corrupcion.
//
// Se queda esperando lecturas de la cola y publica la mas reciente cada
// PUBLISH_INTERVAL_MS, con retain para que la web muestre el ultimo valor
// nada mas suscribirse.
void mqttInicia(QueueHandle_t entrada, UBaseType_t nucleo);
