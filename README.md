# Guía de usuario

Esta guía explica cómo preparar y ejecutar el tablero, ya sea para probar la
interfaz con datos simulados o para recibir telemetría de un ESP32.

## Requisitos

- Windows 10/11 y Git.
- Node.js 22 LTS (incluye npm), para la aplicación web.
- Mosquitto con soporte MQTT sobre TCP y WebSockets, para comunicar la web con
  el simulador o el ESP32.
- Arduino IDE 2.x y una placa ESP32, solo si se va a cargar el firmware.

## 1. Preparar el broker MQTT

La placa y el simulador publican por MQTT/TCP en el puerto `1883`. La aplicación
web se conecta al mismo broker mediante MQTT sobre WebSockets en el puerto
`9001`. El tema usado por defecto es `vehiculo/m2/telemetria`.

Instala Mosquitto en el PC que actuará como broker y crea un archivo
`mosquitto.conf` con estos listeners:

```conf
listener 1883
protocol mqtt

listener 9001
protocol websockets

allow_anonymous true
```

Inicia el broker desde PowerShell, usando la ruta donde guardaste el archivo:

```powershell
mosquitto -c .\mosquitto.conf -v
```

`allow_anonymous true` sirve para pruebas en una red local confiable. No expongas
estos puertos a Internet; limita el acceso con el firewall de Windows. Si la
web se abre desde otro dispositivo, permite también el puerto `9001` en la red
privada. El dispositivo debe poder alcanzar la IP del PC que ejecuta Mosquitto.

## 2. Configurar e iniciar la aplicación web

Desde la raíz del repositorio:

```powershell
cd .\telemetria-web
npm ci
```

Indica la dirección WebSocket del broker creando `telemetria-web/.env.local`.
Reemplaza la IP por la dirección del PC donde corre Mosquitto:

```dotenv
VITE_MQTT_URL=ws://192.168.1.50:9001
VITE_MQTT_TOPIC=vehiculo/m2/telemetria
```

Para abrir la web en el mismo PC se puede usar `ws://localhost:9001`. Para
acceder desde otro dispositivo de la red, inicia Vite así y abre en ese
dispositivo la URL que muestra la terminal:

```powershell
npm run dev -- --host 0.0.0.0
```

La aplicación muestra el tablero en la ruta principal y el estado/contenido
recibido del broker en **MQTT Test**. Si no llega telemetría válida, el tablero
puede mostrar valores simulados; confirma el estado del broker en **MQTT Test**
antes de asumir que los datos son reales.

Para comprobar que el proyecto compila o ejecutar el linter:

```powershell
npm run build
npm run lint
```

## 3. Probar sin conectar un ESP32 (opcional)

Instala Mosquitto en Windows: el simulador usa `mosquitto_pub.exe` en la ruta
`C:\Program Files\mosquitto\mosquitto_pub.exe`. Con el broker ya iniciado,
abre otra terminal en la raíz del repositorio y ejecuta:

```powershell
.\scripts\simular-esp32.ps1 -Host_ 192.168.1.50 -Port 1883
```

Reemplaza la IP por la del PC con el broker. El simulador publica cada segundo
hasta que presiones `Ctrl+C`. Para limitar la prueba, agrega, por ejemplo,
`-Segundos 30`.

## 4. Preparar y cargar el firmware (opcional)

1. En Arduino IDE, instala el soporte de placas **esp32 by Espressif Systems**
   desde Boards Manager y selecciona el modelo de ESP32 que estés usando.
2. Instala la biblioteca **PubSubClient** desde Library Manager.
3. Instala **TFT_eSPI** (versión 2.5.43) y copia su carpeta dentro de
   `firmware/TableroVehicular/src/` con el nombre `TFT_eSPI`. El firmware incluye
   esa biblioteca mediante una ruta local. Configura su `User_Setup.h` con el
   controlador de pantalla y los pines correspondientes al módulo; los pines
   previstos para este tablero están en `config.example.h`.
4. Desde la raíz del repositorio, crea la configuración local:

   ```powershell
   Copy-Item .\firmware\TableroVehicular\config.example.h `
     .\firmware\TableroVehicular\config.h
   ```

5. Edita `firmware/TableroVehicular/config.h`: completa `WIFI_SSID` y
   `WIFI_PASSWORD`, y cambia `MQTT_HOST` por la IP del PC con Mosquitto.
   `MQTT_PORT` debe ser `1883` y `MQTT_TOPIC` debe coincidir con el configurado
   para la web. No compartas ni subas `config.h`: contiene credenciales y está
   excluido del repositorio.
6. Abre `firmware/TableroVehicular/TableroVehicular.ino` en Arduino IDE,
   selecciona el puerto serie de la placa y pulsa **Upload**. Abre el monitor
   serie a `115200` baudios para revisar los mensajes de conexión Wi-Fi y MQTT.

El ESP32 y el PC con Mosquitto deben estar conectados a redes que puedan
comunicarse entre sí. En `MQTT_HOST` usa la IP del PC en esa red; no uses
`localhost`, porque para la placa eso apuntaría al propio ESP32.

## Solución de problemas

- **La web no conecta al broker:** revisa la URL `ws://...:9001`, que el listener
  WebSockets esté activo y que el firewall permita el puerto en la red privada.
- **MQTT Test conecta, pero no aparecen datos del ESP32:** comprueba que el
  firmware y la web usan el mismo tema, que `MQTT_HOST` apunta al PC correcto y
  que el ESP32 logró conectarse al Wi-Fi.
- **El simulador no arranca:** verifica que Mosquitto esté instalado en la ruta
  indicada y que `mosquitto_pub.exe` exista allí.
- **Error de compilación por TFT_eSPI o PubSubClient:** confirma la instalación
  de PubSubClient y que TFT_eSPI esté dentro de `firmware/TableroVehicular/src/TFT_eSPI`
  con `User_Setup.h` configurado.
