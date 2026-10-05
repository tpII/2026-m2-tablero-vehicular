// Copia este archivo como config.h y rellena los valores reales.
// config.h esta en .gitignore: nunca subas la clave del WiFi al repo.

#pragma once

// ---------------------------------------------------------------- Red
#define WIFI_SSID     "Barcala 5.8G"
#define WIFI_PASSWORD "Becarios2024"

// ---------------------------------------------------------------- MQTT
// Host = IP del PC donde corre Mosquitto. Con hotspot de Windows seria
// 192.168.137.1; compartiendo la red WiFi del laboratorio es la IP de tu PC.
#define MQTT_HOST      "10.0.22.205"
#define MQTT_PORT      1883
#define MQTT_TOPIC     "vehiculo/m2/telemetria"
#define MQTT_CLIENT_ID "tablero-vehicular"

// ---------------------------------------------------------------- Cadencia
#define PUBLISH_INTERVAL_MS 1000
#define MAX_RPM             8000

// ---------------------------------------------------------------- Sensores
// El potenciometro va a un pin de ADC1 (32-39). Los de ADC2 no funcionan
// mientras el WiFi esta activo.
#define PIN_POTENCIOMETRO 35

// ---------------------------------------------------------------- Pantalla
// Pines del ST7789. Se=configuran en el bloque 3, junto con User_Setup.h
// de TFT_eSPI. Ajusta CS si tuDisplay lo tiene conectado.
#define PIN_TFT_MOSI 23
#define PIN_TFT_SCLK 18
#define PIN_TFT_CS   15
#define PIN_TFT_DC    2
#define PIN_TFT_RST   4
#define PIN_TFT_BL   21
