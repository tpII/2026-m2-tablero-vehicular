// Copia este archivo como config.h y rellena los valores reales.
// config.h esta en .gitignore: nunca subas la clave del WiFi al repo.

#pragma once

// ---------------------------------------------------------------- Red
#define WIFI_SSID "TCL-Alan"
#define WIFI_PASSWORD "etajmsql"

// ---------------------------------------------------------------- MQTT
// Host = IP del PC donde corre Mosquitto. Con hotspot de Windows seria
// 192.168.137.1; compartiendo la red WiFi del laboratorio es la IP de tu PC.
#define MQTT_HOST "10.51.117.217"
#define MQTT_PORT 1883
#define MQTT_TOPIC "vehiculo/m2/telemetria"
#define MQTT_CLIENT_ID "tablero-vehicular"

// ---------------------------------------------------------------- Cadencia
#define PUBLISH_INTERVAL_MS 100
#define MAX_RPM 8000

// ---------------------------------------------------------------- Nucleos
// El stack de WiFi/TLS vive en el core de Arduino (0). MQTT DEBE ir ahi
// porque comparte el socket de red con el, y los sensores en el core 1 para
// que ninguna tarea se bloquee a la otra.
#define NUCLEO_MQTT 0
#define NUCLEO_SENSORES 1
#define NUCLEO_PANTALLA 1

// MQTT por encima de sensores: publicar no espera a nadie, muestrear si.
#define PRIORIDAD_MQTT 2
#define PRIORIDAD_SENSORES 1

// La pantalla dibuja por debajo de los sensores a proposito: una pasada de
// SPI bloquea decenas de ms y no debe hacer perder una muestra.
#define PRIORIDAD_PANTALLA 0

// Frecuencia de muestreo. El nucleo de MQTT publica cada
// PUBLISH_INTERVAL_MS usando la ultima lectura disponible.
#define SENSOR_PERIOD_MS 50

// Refresco de las agujas. 60ms da ~16 fps, suficiente para un medidor y deja
// margen entre pasadas para el resto del trabajo del core.
#define PANTALLA_PERIOD_MS 60

// ---------------------------------------------------------------- Entradas
// El potenciometro debe caer en ADC1 (GPIO 32-39): con WiFi encendido los
// pines ADC2 estan ocupados y analogRead devuelve basura.
#define PIN_POTENCIOMETRO 35

// 0 = el acelerador sale de la simulacion, 1 = se lee el ADC real.
#define USAR_POTENCIOMETRO_REAL 1

// ---------------------------------------------------------------- Pantalla
// Pines del ST7789. Se=configuran en el bloque 3, junto con User_Setup.h
// de TFT_eSPI. Ajusta CS si tuDisplay lo tiene conectado.
#define PIN_TFT_MOSI 23
#define PIN_TFT_SCLK 18
#define PIN_TFT_CS 15
#define PIN_TFT_DC 2
#define PIN_TFT_RST 4
#define PIN_TFT_BL 21
