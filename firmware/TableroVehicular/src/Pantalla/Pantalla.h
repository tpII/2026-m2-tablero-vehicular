#pragma once

#include <Arduino.h>
#include <freertos/FreeRTOS.h>
#include <freertos/queue.h>

#include "../Telemetria/Telemetria.h"

// Nucleo de pantalla. Es el UNICO que escribe en el bus SPI y el UNICO que
// dibuja, asi que TFT_eSPI y los MeterWidget no necesitan mutex.
//
// NO lee sensores: consume la misma struct Telemetry que el nucleo de MQTT,
// pero por su propia cola. Las dos son de longitud 1 con xQueueOverwrite, asi
// que la pantalla nunca le roba una lectura al MQTT ni lo al revés.
//
// Prioridad por debajo de los sensores a proposito: una pasada completa de
// dibujado bloquea durante decenas de milisegundos por SPI y no debe hacer
// que el muestreo se salte su periodo de SENSOR_PERIOD_MS.
void pantallaInicia(QueueHandle_t entrada, UBaseType_t nucleo);