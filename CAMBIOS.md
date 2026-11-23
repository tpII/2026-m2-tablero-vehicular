# Cambios y diagnóstico MQTT

Este documento resume los cambios realizados y analizados durante la puesta en
marcha de la telemetría MQTT entre el ESP32, las páginas web y el guardado
histórico en CSV.

## 1. Error de JSON en la telemetría

### Problema

La página de prueba recibía mensajes como:

```text
{"potentiometer":78.2,"motorPwm":78.0,"rpm":0.0,"speed":0.00,"current":inf,"power":0.0}
```

`inf` no es un valor admitido por JSON. Al ejecutar `JSON.parse`, el navegador
generaba `SyntaxError` y descartaba el mensaje completo. Esto no demostraba por
sí mismo que el INA219 estuviera mal conectado: indicaba que alguna lectura
publicada no era finita.

### Cambios para resolverlo

- En `firmware/TableroVehicular/TableroVehicular.ino` se agregó el formateo de
  valores flotantes para publicar `null` cuando un valor no es finito, en vez
  de escribir `inf` en el JSON.
- En `web/app.js` se protegió el parseo y se agregó compatibilidad para
  normalizar `inf`/`NaN` de mensajes de firmware anterior a `null`. Los campos
  nulos se muestran como `-` y un mensaje malformado ya no interrumpe el
  manejador MQTT.

Después de esos cambios se confirmó que la página podía mostrar los mensajes.
Si aún aparece `inf` en un mensaje, el ESP32 que lo publica probablemente no
tiene cargado el firmware corregido, o hay otro publicador enviando al mismo
topic.

## 2. Adaptación de la aplicación React

La aplicación de `telemetria-web/` es independiente de `web/`; corregir una no
actualiza automáticamente la otra.

En `telemetria-web/src/mqtt/mqttConfig.js` se adaptó el parser para aceptar los
nombres publicados por el firmware y conservar los nombres internos que usan
las pantallas React. Entre las conversiones:

- `speed` a `velocidad`.
- `potentiometer` a `potenciometro`.
- `current` en mA a `corrienteMotor` en A.
- `power` en mW a `potenciaMotor` en W.
- Los `inf`/`NaN` antiguos se interpretan como nulos.

Se mantuvieron las dos suscripciones del provider: sensores y estado. En
`useTelemetry.js` y `Home.jsx`, los campos de batería y tensión que el payload
actual no proporciona dejaron de presentarse como si fueran lecturas reales;
cuando no hay valor se muestra `--`.

El topic de sensores React se alineó con el firmware: `vehicle/m2/telemetry`.
La conectividad del navegador requiere WebSocket en el puerto `9001`, mientras
que el ESP32 y el logger usan MQTT TCP en el puerto `1884`.

## 3. Topic de estado del ESP32

En `firmware/TableroVehicular/config.h` se agregó la definición de topic de
estado y en `firmware/TableroVehicular/src/Mqtt.cpp` se modificó la conexión
para:

- Configurar `offline` como Last Will retenido, para que el broker lo publique
  si se pierde inesperadamente la conexión del ESP32.
- Publicar `online` retenido después de una conexión MQTT exitosa.

Definir un topic no lo crea ni publica mensajes por sí solo: el firmware debe
estar compilado y cargado en el ESP32, y el dispositivo debe conectarse al
broker.

## 4. Logger MQTT y CSV

Se preparó el logger Node.js `mqtt-logger/logger.mjs`, que escucha el topic de
sensores y el topic de estado, y agrega filas a `mqtt-logger/data/telemetria.csv`.
Registra timestamp, estado y valores del payload. Los valores no finitos se
guardan vacíos; el estado del dispositivo se escribe en la columna `status`.

El CSV existente contiene filas de sensores con `unknown`. Eso ocurre cuando
el logger todavía no recibió un mensaje `online` u `offline` en el topic de
estado al que está suscrito. `unknown` es el valor inicial del logger, no un
estado publicado por el ESP32. Las filas históricas no se actualizan cuando
llega un mensaje de estado posterior.

También se intentó usar `mosquitto_sub` para observar el topic desde Windows,
pero el comando no estaba instalado o no estaba en el `PATH`. Como alternativa
se proporcionó un comando Node.js usando el paquete MQTT ya instalado en el
logger.

## 5. Configuración de Mosquitto

En `mosquitto/mosq-test.conf` se mantuvieron los listeners MQTT TCP y WebSocket:

- TCP `1884`, usado por el ESP32 y el logger.
- WebSocket `9001`, usado por las aplicaciones web.

Se habilitó `allow_anonymous true` para ambos listeners en el entorno de
prueba.

## Estado actual y pendientes

- **El CSV muestra `unknown` en las filas revisadas.** Alinear el topic y
  reiniciar el logger, además de cargar/reiniciar el firmware actualizado, es
  necesario para que las filas nuevas reflejen `online` u `offline`.
- Quitar `localStorage["mqtt.statusTopic"]` solo afecta a React. No cambia la
  configuración del logger ni las filas ya escritas en el CSV. También debe
  revisarse que `VITE_MQTT_STATUS_TOPIC` y `MQTT_STATUS_TOPIC`, si están
  definidas, no sobrescriban el topic esperado.
- El firmware actual no publica batería ni tensión del motor en su payload; la
  interfaz React las deja sin dato real hasta que el firmware las incluya.
- No quedó confirmado en esta revisión si el firmware con Last Will ya está
  cargado en el ESP32 ni si la instancia del logger en ejecución fue reiniciada
  después de cambiar su configuración.

## Verificaciones realizadas

- El parser de React se probó con el payload del firmware, incluyendo valores
  `inf`, alias de campos y conversiones de unidades.
- `npm run lint` y el build directo de Vite pasaron para `telemetria-web`.
- `npm run build` no pasó el chequeo TypeScript por imports existentes de
  módulos `.jsx` sin declaraciones de tipo (`TS7016`); el build de Vite por
  separado sí generó la aplicación.
- No se compiló el firmware durante esta sesión porque no había una herramienta
  de compilación Arduino disponible en el entorno.

---

# FreeRTOS

En esta etapa se migró la gestión de MQTT a una tarea dedicada de FreeRTOS
anclada al núcleo 0, separando la red de la captura de datos.

## 1. Migración de MQTT a una tarea en el núcleo 0

### Problema

La tarea de sensores (`RunTask`) y `loop()` de Arduino compartían el núcleo 1.
En ese mismo núcleo se ejecutaban `KeepMqttAlive()`, el armado del JSON y el
publish, de modo que MQTT competía por CPU con los sensores, mientras que el
stack de red (WiFi/lwIP) corría aislado en el núcleo 0, subutilizado.

### Cambios para resolverlo

Se separó la responsabilidad por núcleo manteniendo el esquema de dos colas
FreeRTOS sin mutexes, donde cada recurso tiene un solo dueño:

- En `firmware/TableroVehicular/config.h` se agregaron las constantes
  `MQTT_CORE` (0), `MQTT_PRIORITY` (2), `MQTT_STACK_SIZE` (4096),
  `MQTT_LOOP_MS` (20) y `MQTT_SOCKET_TIMEOUT_S` (2).
- En `firmware/TableroVehicular/src/Mqtt.cpp` se creó la tarea `mqttTask`
  anclada al núcleo 0 con `xTaskCreatePinnedToCore`, la cola `telemetryQueue`
  de longitud 1 con `xQueueOverwrite` (publica siempre el último snapshot y
  descarta los atrasados) y la función `SendTelemetry` como frontera entre
  núcleos. Únicamente `mqttTask` toca `mqttClient` y `WiFiClient`, por lo que
  no se necesitan mutexes. Se agregó `setSocketTimeout(2)` para que las
  reconexiones no bloqueen el núcleo 0 por el timeout por defecto de
  PubSubClient (15 s), y `PrintMqtt` ahora reporta
  `uxTaskGetStackHighWaterMark` de la tarea MQTT.
- En `firmware/TableroVehicular/TableroVehicular.ino` se quitó
  `KeepMqttAlive()` del `loop()`: el armado del JSON permanece en el núcleo 1 y
  el payload se entrega a la tarea MQTT con `SendTelemetry` en lugar de llamar
  a `PublishMqtt` directamente.

La tabla de distribución final quedó así:

| Núcleo | Tareas | Comunicación |
|---|---|---|
| 0 | WiFi/lwIP (sistema) + `mqttTask` | recibe de `telemetryQueue` |
| 1 | `RunTask` sensores + `loop()` (display, Hall, JSON) | envía por `taskQueue` y `telemetryQueue` |

El núcleo 0 se eligió para MQTT porque allí ya viven WiFi y lwIP; el ADC del
encoder usa el canal ADC1 (compatible con WiFi) y las lecturas del sensor Hall
se hacen por interrupción, por lo que leerlas desde cualquier núcleo es barato.

### Pendiente verificar

- Confirmar con `xPortGetCoreID()` que `setup`/`loop` corren en el núcleo 1 y
  `mqttTask` en el núcleo 0.
- Revisar el stack libre de `mqttTask` con `PrintMqtt`; si el high water mark
  baja de ~1000 bytes, subir `MQTT_STACK_SIZE`.
- Compilar y cargar el firmware; no se realizó la compilación en esta sesión.

## 6. Ajustes de red y unidades (m/s)

### Problema

El ESP32 reportaba MQTT desconectado (State: -2) aunque WiFi estaba conectado.
Causa: desajuste de puerto (firmware 1884 vs Mosquitto 1883) e IP del PC
cambiada a 10.181.76.205.

### Cambios realizados

- config.h: MQTT_HOST 10.181.76.205, MQTT_PORT 1883.
- mqttConfig.js: DEFAULT_URL ws://10.181.76.205:9001.
- TableroVehicular.ino: velocidad publicada en m/s (sin *3.6).
- Mqtt.cpp: log de init con host/puerto.

### React / UI

- Home.jsx: potenciometro con 1 decimal; aguja m/s escala 0-2 con 2 decimales; RPM 0-200; etiquetas m/s.
- Telemetry.jsx: grafico con dos ejes Y (acelerador y RPM).
- useTelemetry.js: mock de velocidad adaptado a m/s.

### Repositorio

- mqtt-logger/ agregado a .gitignore.
