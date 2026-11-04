#pragma once

#define PIN_ENCODER 34
#define PIN_MOTOR_IN1 25
#define PIN_INA219_SDA 21
#define PIN_INA219_SCL 22
#define PIN_HALL 27

#define WIFI_SSID "YOUR_SSID"
#define WIFI_PASSWORD "YOUR_PASSWORD"

#define MQTT_HOST "10.51.117.217"
#define MQTT_PORT 1884
#define MQTT_CLIENT_ID "vehicle-dashboard"
#define MQTT_TOPIC "vehicle/m2/telemetry"

#define CONTROL_TASK_PERIOD_MS 100
#define CONTROL_TASK_PRIORITY 2
#define CONTROL_TASK_CORE 1
#define CONTROL_TASK_STACK 4096
