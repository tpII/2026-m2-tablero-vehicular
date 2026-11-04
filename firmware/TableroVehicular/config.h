#pragma once

#define PIN_ENCODER 34
#define PIN_MOTOR_IN1 25
#define PIN_INA219_SDA 21
#define PIN_INA219_SCL 22
#define PIN_HALL 27

#define WIFI_SSID "TCL-Alan"
#define WIFI_PASSWORD "etajmsql"

#define MQTT_HOST "10.181.76.217"
#define MQTT_PORT 1884
#define MQTT_CLIENT_ID "vehicle-dashboard"
#define MQTT_TOPIC "vehicle/m2/telemetry"
#define MQTT_STATUS_TOPIC "vehicle/m2/status"

#define MQTT_CORE       0
#define MQTT_PRIORITY   2
#define MQTT_STACK_SIZE 4096
#define MQTT_LOOP_MS    20
#define MQTT_SOCKET_TIMEOUT_S 2

#define TASK_PERIOD_MS 100
#define TASK_PRIORITY 2
#define TASK_CORE 1
