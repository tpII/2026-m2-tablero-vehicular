# Tablero Vehicular - M2

## 2026-09-04 - Iacobucci, Platz, Prieto

Actividades realizadas

- Puesta en común de conocimientos previos del grupo: se relevaron las habilidades individuales en programación y en armado/manejo de hardware, para tener un panorama claro de con qué fortalezas cuenta cada integrante de cara a la división de tareas del proyecto.
- Búsqueda y relevamiento de documentación técnica necesaria para arrancar el desarrollo, cubriendo los tres ejes del proyecto (pantalla gráfica, arquitectura multitarea y comunicación de red).
- Relevamiento de los componentes periféricos mencionados en el listado de materiales: pantalla TFT táctil, motor DC, driver de motor, sensor de efecto Hall, sensor de consumo y potenciómetro.
- Inicio de la redacción del primer entregable: Plan de Proyecto.

Documentación relevada

| Recurso                                                   | Link                                                                                           |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| TFT_eSPI                                                  | https://github.com/Bodmer/TFT_eSPI                                                             |
| SPI, Wikipedia                                            | https://en.wikipedia.org/wiki/Serial_Peripheral_Interface                                      |
| FreeRTOS, ESP-IDF Programming Guide (Espressif)           | https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-reference/system/freertos.html |
| ESP-MQTT (Espressif)                                      | https://github.com/ESPressif/ESP-mqtt                                                          |
| Port de Mosquitto para ESP-IDF (Espressif Developer Blog) | https://developer.espressif.com/blog/2025/05/esp-idf-mosquitto-port/                           |
| PlatformIO                                                | https://platformio.org/                                                                        |
| Arduino IDE                                               | https://docs.arduino.cc/software/ide/                                                          |
| Arduino ESP32 / FreeRTOS tasks                            | https://randomnerdtutorials.com/esp32-dual-core-arduino-ide/                                   |

---

## 2026-09-06 - Iacobucci, Platz, Prieto

Actividades realizadas

- Búsqueda de datasheet y definición del conexionado para el ESP32, pantalla TFT, driver de motor, potenciómetro, LEDs y sensores.
- Armado del esquemático inicial del circuito integrando todos los periféricos.

Documentación relevada

| Recurso         | Link                                                                        |
| --------------- | --------------------------------------------------------------------------- |
| Datasheet ESP32 | https://www.alldatasheet.com/datasheet-pdf/pdf/1243003/ESPRESSIF/ESP32.html |

---

## 2026-09-10 - Iacobucci, Platz, Prieto

Actividades realizadas

- Finalización de la redacción grupal de la Propuesta de Proyecto, integrando los objetivos, cronograma, requerimientos técnicos y metodología de trabajo definidos para el desarrollo del tablero vehicular.
- Revisión final de la propuesta y preparación del documento para su entrega.

---

## 2026-09-11 - Iacobucci, Platz, Prieto

Actividades realizadas

- Corrección del Plan de Proyecto aplicando las observaciones indicadas por la docente responsable, Cabrera Merlina.
- Armado de la presentación para exponer la propuesta.

---

## 2026-09-13 - Platz

Actividades realizadas

- Realizado de video de documentación.
- Entrega del Plan de Proyecto.

---

## 2026-09-14 - Iacobucci

Actividades realizadas

- Creación del proyecto en React para la interfaz web del tablero.
- Primeras ideas y bocetos de diseño para la GUI (qué mostrar y cómo distribuir la pantalla).

Documentación relevada

| Recurso  | Link                              |
| -------- | --------------------------------- |
| ReCharts | https://recharts.github.io/       |
| MQTT JS  | https://github.com/mqttjs/MQTT.js |

---

## 2026-09-17 - Prieto

Actividades realizadas

- Desarrollo de las vistas "Home" (espejo de la TFT física) y "Telemetry" (análisis histórico de sensores con Recharts).
- Implementación y validación de comunicación MQTT vía WebSockets para la recepción de la telemetría del vehículo.
