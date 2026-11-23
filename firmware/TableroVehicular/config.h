#pragma once

#define PIN_ENCODER 34
#define PIN_MOTOR_IN1 25
#define PIN_INA219_SDA 21
#define PIN_INA219_SCL 22
#define PIN_HALL 27

#define PIN_TFT_MOSI 23
#define PIN_TFT_SCLK 18
#define PIN_TFT_CS 15
#define PIN_TFT_DC 2
#define PIN_TFT_RST 4

#define DISPLAY_ROTATION 1
#define DISPLAY_CYCLE_MS 5000

#define WIFI_SSID "TableroM2"
#define WIFI_PASSWORD "tablero2026m2"

#define MQTT_HOST "192.168.4.2"
#define MQTT_PORT 1884
#define MQTT_CLIENT_ID "vehicle-dashboard"
#define MQTT_TOPIC "vehicle/m2/telemetry"
#define MQTT_STATUS_TOPIC "vehicle/m2/status"
#define MQTT_PAYLOAD_SIZE 160

#define CONTROL_TASK_PERIOD_MS 100
#define CONTROL_TASK_PRIORITY 2
#define CONTROL_TASK_CORE 1
#define CONTROL_TASK_STACK 4096

#define MQTT_TASK_PERIOD_MS 20
#define MQTT_TASK_PRIORITY 2
#define MQTT_TASK_CORE 0
#define MQTT_TASK_STACK 4096
