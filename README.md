# Tablero Vehicular
## Guía de Uso y Configuración
Esta guía establece los requerimientos, procedimientos de configuración y protocolo de ejecución para la puesta en marcha del tablero de telemetría vehicular, utilizando datos simulados o telemetría en tiempo real desde un microcontrolador ESP32.

---

## 1. Requisitos del Sistema

- **Sistema Operativo y Control de Versiones:** Windows 10/11 y Git.
- **Entorno de Ejecución Web:** Node.js 22 LTS (incluye ejecutable `npm`).
- **Broker de Mensajería:** Eclipse Mosquitto con soporte para protocolos MQTT nativo (TCP) y MQTT over WebSockets.
- **Entorno de Desarrollo Embedded:** Arduino IDE 2.x con soporte para arquitectura ESP32 (requerido únicamente para la compilación y despliegue del firmware).

---

## 2. Arquitectura e Instalación del Broker MQTT

### 2.1 Esquema de Puertos y Protocolos

- **Publicación de Telemetría (ESP32 / Simulador):** Puerto `1883` (`mqtt/tcp`).
- **Suscripción de Cliente Web (Dashboard):** Puerto `9001` (`mqtt/websockets`).
- **Tópicos por defecto:**
  - `vehiculo/m2/telemetria`: objeto JSON con las mediciones periódicas del vehículo.
  - `vehiculo/m2/estado`: estado retained del dispositivo (`online` / `offline`).

### 2.2 Configuración del Servicio Mosquitto

Cree un archivo de configuración denominado `mosquitto.conf` en el directorio de ejecución del broker con la siguiente directiva de listeners:

```conf
listener 1883
protocol mqtt

listener 9001
protocol websockets

allow_anonymous true

```

### 2.3 Despliegue del Servicio

Inicie el proceso del broker desde una terminal PowerShell especificando la ruta al archivo de configuración:

```powershell
mosquitto -c .\mosquitto.conf -v

```

> **Nota de Seguridad:** La directiva `allow_anonymous true` debe emplearse estrictamente en entornos de red local controlados. Habilite las reglas de entrada correspondientes en el Firewall de Windows para el puerto `9001` (red privada) si la aplicación cliente consume el servicio desde un host remoto dentro de la misma subred.

---

## 3. Configuración y Despliegue de la Aplicación Web

### 3.1 Instalación de Dependencias

Desde el directorio raíz del repositorio, ejecute la instalación limpia de paquetes:

```powershell
cd .\telemetria-web
npm ci

```

### 3.2 Variables de Entorno

Cree el archivo de variables de entorno `.env.local` en el directorio `telemetria-web/`. Defina la dirección de conexión WebSocket apuntando a la IP de la interfaz de red del broker:

```dotenv
VITE_MQTT_URL=ws://<IP_DEL_BROKER>:9001
VITE_MQTT_TOPIC=vehiculo/m2/telemetria
VITE_MQTT_STATUS_TOPIC=vehiculo/m2/estado

```

El dashboard se suscribe a ambos tópicos: usa `/telemetria` para actualizar las mediciones y `/estado` para mostrar la disponibilidad del ESP32. El estado de conexión al broker (WebSocket) se informa por separado.

_(Para despliegues locales sobre el mismo host, puede emplearse `ws://localhost:9001`)._

### 3.3 Ejecución en Modo Desarrollo

Para exponer la interfaz web a la red local, inicie el servidor de desarrollo enlazando la interfaz `0.0.0.0`:

```powershell
npm run dev -- --host 0.0.0.0

```

- **Ruta Principal (`/`):** Despliega el tablero de instrumentos. Si no se detecta un flujo válido de carga útil MQTT, el sistema renderizará valores simulados por defecto.
- **Módulo de Diagnóstico (`/mqtt-test`):** Permite verificar el estado de la conexión WebSocket y validar los payloads entrantes.

### 3.4 Validación de Código y Build

Para comprobar la integridad del código fuente y realizar el empaquetado de producción:

```powershell
npm run build
npm run lint

```

---

## 4. Simulador de Telemetría (Entorno de Pruebas)

El script de simulación requiere la presencia del binario ejecutable `mosquitto_pub.exe` en la ruta predeterminada de instalación: `C:\Program Files\mosquitto\mosquitto_pub.exe`.

Con el servicio de Mosquitto activo, ejecute el script de PowerShell desde la raíz del proyecto indicando la IP objetivo:

```powershell
.\scripts\simular-esp32.ps1 -Host_ <IP_DEL_BROKER> -Port 1883

```

- **Parámetros Opcionales:** Utilice `-Segundos <N>` para delimitar la duración del envío (ej. `-Segundos 30`). Por defecto, la publicación mantiene un intervalo de `1 Hz` (1 segundo) hasta la interrupción manual (`Ctrl+C`).
- El simulador publica el JSON en `vehiculo/m2/telemetria` y el estado retained en `vehiculo/m2/estado`: `online` al comenzar y `offline` al terminar. Puede cambiar los tópicos con `-Topic` y `-StatusTopic`.

---

## 5. Compilación y Carga del Firmware (ESP32)

### 5.1 Aprovisionamiento del Entorno en Arduino IDE

1. En **Boards Manager**, instale el paquete `esp32` de _Espressif Systems_ y seleccione la tarjeta objetivo.
2. Desde el **Library Manager**, instale la biblioteca `PubSubClient`.
3. Descargue e instale la biblioteca `TFT_eSPI` (v2.5.43). Copie el directorio de la librería en la ruta local del proyecto: `firmware/TableroVehicular/src/TFT_eSPI`.
4. Configure el archivo `User_Setup.h` interno según las especificaciones del controlador de pantalla y la asignación de pines definida en `config.example.h`.

### 5.2 Configuración del Dispositivo

Copie la plantilla de configuración e inicialice el archivo local de credenciales:

```powershell
Copy-Item .\firmware\TableroVehicular\config.example.h .\firmware\TableroVehicular\config.h

```

Edite `firmware/TableroVehicular/config.h` e ingrese los parámetros de red:

- `WIFI_SSID`: Identificador de la red Wi-Fi.
- `WIFI_PASSWORD`: Clave de acceso Wi-Fi.
- `MQTT_HOST`: Dirección IP estática o reservada del servidor/PC donde ejecuta Mosquitto (evite usar `localhost`).
- `MQTT_PORT`: `1883`
- `MQTT_TOPIC`: Tópico del JSON periódico; debe coincidir con `VITE_MQTT_TOPIC`.
- `MQTT_STATUS_TOPIC`: Tópico del estado `online`/`offline`; debe coincidir con `VITE_MQTT_STATUS_TOPIC`. El firmware publica `online` retained y configura `offline` como Last Will retained.

### 5.3 Flasheo e Inspección

1. Abra `firmware/TableroVehicular/TableroVehicular.ino` en Arduino IDE.
2. Seleccione el puerto serie (COM) de la placa y ejecute la instrucción **Upload**.
3. Inicie el **Serial Monitor** a `115200 baudios` para monitorear los registros (_logs_) de autenticación de red y estado del cliente MQTT.

---

## 6. Diagnóstico de Fallas (Troubleshooting)

| Anomalía / Error                                                   | Causa Probable                            | Acción Correctiva                                                                                                                     |
| ------------------------------------------------------------------ | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Fallo de conexión WebSocket en la App Web**                      | Listener inaccesible o puerto bloqueado.  | Verifique que `mosquitto.conf` contenga el listener `9001` activo. Acepte las reglas de tráfico entrante en el firewall de Windows.   |
| **Cliente MQTT conecta, pero no renderiza datos del ESP32**        | Discrepancia de tópico de telemetría o IP errónea. | Verifique que `VITE_MQTT_TOPIC` coincida con `MQTT_TOPIC` (`vehiculo/m2/telemetria`) y que el ESP32 resolvió la dirección IP de `MQTT_HOST`. |
| **El dashboard muestra el ESP32 como desconocido**                 | No llega el estado del dispositivo o los tópicos no coinciden. | Verifique que `VITE_MQTT_STATUS_TOPIC` coincida con `MQTT_STATUS_TOPIC` (`vehiculo/m2/estado`) y que el firmware esté conectado al broker. |
| **Fallo en la ejecución del script de simulación**                 | Falta del ejecutable `mosquitto_pub.exe`. | Valide la instalación de Mosquitto en la ruta estándar `C:\Program Files\mosquitto\`.                                                 |
| **Error de inclusión o compilación (`TFT_eSPI` / `PubSubClient`)** | Estructura de librerías incorrecta.       | Asegúrese de situar la carpeta `TFT_eSPI` directamente en `firmware/TableroVehicular/src/TFT_eSPI` y restrinja la versión a `2.5.43`. |
