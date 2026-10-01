<<<<<<< HEAD
#include <Arduino.h>
#include <PubSubClient.h>
#include <WiFi.h>

#include "config.h"

WiFiClient net;
PubSubClient mqtt(net);

unsigned long lastPublish = 0;
unsigned long lastWifiRetry = 0;
unsigned long lastMqttRetry = 0;
unsigned long lastSimulacion = 0;
unsigned long nextScenarioChange = 0;
bool wifiReportado = false;
const unsigned long RETRY_MS = 2000;

// Simulacion: los sensores reales se reemplazan aqui en bloques posteriores
float velocidad = 0;
float velocidadObjetivo = 0;
float potenciometro = 0;
float bateria = 12.6;

float limita(float valor, float min, float max) {
  if (valor < min) return min;
  if (valor > max) return max;
  return valor;
}

float acerca(float actual, float objetivo, float factor) {
  return actual + (objetivo - actual) * factor;
}

// Sierra calada por marcha: sube dentro de cada marcha y cae al cambiar
float calculaRpm(float kmh) {
  const float velMax = 140.0f;
  const int marches = 6;
  const float ralenti = 800.0f;

  float posicion = limita(kmh / velMax, 0.0f, 1.0f) / (1.0f / marches);
  int marcha = constrain((int)posicion, 0, marches - 1);
  float dentro = (posicion - marcha) * 0.88f;

  return ralenti + dentro * (MAX_RPM - ralenti);
}

void imprimeEstadoRed() {
  Serial.print("[wifi] IP: ");
  Serial.println(WiFi.localIP());
}

void conectaWifi() {
  Serial.printf("[wifi] conectando a \"%s\"...\n", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
}

void mantieneWifi(unsigned long ahora) {
  if (WiFi.status() == WL_CONNECTED) {
    if (!wifiReportado) {
      wifiReportado = true;
      imprimeEstadoRed();
    }
    return;
  }

  if (ahora - lastWifiRetry < RETRY_MS) return;

  wifiReportado = false;
  lastWifiRetry = ahora;
  conectaWifi();
}

void publicaTelemetria() {
  char payload[192];
  snprintf(payload, sizeof(payload),
           "{\"velocidad\":%.1f,\"rpm\":%.0f,\"maxRpm\":%.0f,"
           "\"potenciometro\":%.0f,\"bateria\":%.2f}",
           velocidad, calculaRpm(velocidad), (float)MAX_RPM, potenciometro, bateria);

  // retain para que la web muestre el ultimo valor nada mas suscribirse
  mqtt.publish(MQTT_TOPIC, payload, true);
}

void conectaMqtt() {
  String clientId = String(MQTT_CLIENT_ID) + "-" + WiFi.macAddress();
  bool ok = mqtt.connect(clientId, MQTT_TOPIC, 0, true, "offline");

  if (ok) {
    Serial.printf("[mqtt] conectado como %s\n", clientId.c_str());
    mqtt.publish(MQTT_TOPIC, "online", true);
  } else {
    Serial.printf("[mqtt] fallo, estado %d\n", mqtt.state());
  }
}

void mantieneMqtt(unsigned long ahora) {
  if (WiFi.status() != WL_CONNECTED) return;
  if (mqtt.connected()) return;
  if (ahora - lastMqttRetry < RETRY_MS) return;

  lastMqttRetry = ahora;
  conectaMqtt();
}

void actualizaSimulacion(unsigned long ahora) {
  float segundos = lastSimulacion == 0 ? 0.0f : (ahora - lastSimulacion) / 1000.0f;
  lastSimulacion = ahora;

  if (ahora >= nextScenarioChange) {
    nextScenarioChange = ahora + 4000 + random(6000);
    velocidadObjetivo = random(0, 131);
  }

  velocidad = acerca(velocidad, velocidadObjetivo, 0.06f);

  // El acelerador responde a la diferencia entre velocidad deseada y real
  float demanda = limita((velocidadObjetivo - velocidad) * 7.0f, 0.0f, 100.0f);
  if (velocidadObjetivo < velocidad) demanda = 0;
  potenciometro = acerca(potenciometro, demanda, 0.12f);

  // El alternador recarga por encima de 3000 rpm y consume el resto
  if (calculaRpm(velocidad) > 3000) {
    bateria = limita(bateria + 0.004f * segundos, 11.8f, 14.4f);
  } else {
    bateria = limita(bateria - 0.00008f * segundos, 11.8f, 14.4f);
  }
}

void setup() {
  Serial.begin(115200);
  unsigned long espera = millis();
  while (!Serial && millis() - espera < 2000) {
  }

  randomSeed(esp_random());

  WiFi.persistent(false);
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);

  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  mqtt.setBufferSize(512);
  mqtt.setKeepAlive(30);
  mqtt.setSocketTimeout(5);

  conectaWifi();
}

void loop() {
  unsigned long ahora = millis();

  mantieneWifi(ahora);
  mantieneMqtt(ahora);

  actualizaSimulacion(ahora);

  if (mqtt.connected() && ahora - lastPublish >= PUBLISH_INTERVAL_MS) {
    lastPublish = ahora;
    publicaTelemetria();
  }

  delay(10);
=======
/*
  Example animated analogue meters

  Needs Font 2 (also Font 4 if using large scale label)

  Make sure all the display driver and pin connections are correct by
  editing the User_Setup.h file in the TFT_eSPI library folder.

  #########################################################################
  ###### DON'T FORGET TO UPDATE THE User_Setup.h FILE IN THE LIBRARY ######
  #########################################################################

  Requires widget library here:
  https://github.com/Bodmer/TFT_eWidget
*/

// Librerias locales en src/ (el IDE compila src/ automaticamente)
#include "src/TFT_eSPI/TFT_eSPI.h"     // Hardware-specific library
#include "src/TFT_eSPI/TFT_eWidget.h"  // Widget library

TFT_eSPI tft  = TFT_eSPI();      // Invoke custom library

MeterWidget   amps  = MeterWidget(&tft);
MeterWidget   volts = MeterWidget(&tft);
MeterWidget   ohms  = MeterWidget(&tft);

#define LOOP_PERIOD 35 // Display updates every 35 ms

void setup(void) 
{
  tft.init();
  tft.setRotation(0);
  Serial.begin(115200); // For debug
  
  
  // Colour zones are set as a start and end percentage of full scale (0-100)
  // If start and end of a colour zone are the same then that colour is not used
  //            --Red--  -Org-   -Yell-  -Grn-
  amps.setZones(75, 100, 50, 75, 25, 50, 0, 25); // Example here red starts at 75% and ends at 100% of full scale
  // Meter is 239 pixels wide and 126 pixels high
  amps.analogMeter(0, 0, 2.0, "mA", "0", "0.5", "1.0", "1.5", "2.0");    // Draw analogue meter at 0, 0

  // Colour draw order is red, orange, yellow, green. So red can be full scale with green drawn
  // last on top to indicate a "safe" zone.
  //             -Red-   -Org-  -Yell-  -Grn-
  volts.setZones(0, 100, 25, 75, 0, 0, 40, 60);
  volts.analogMeter(0, 128, 10.0, "V", "0", "2.5", "5", "7.5", "10"); // Draw analogue meter at 0, 128

  // No coloured zones if not defined
  ohms.analogMeter(0, 256, 100, "R", "0", "", "50", "", "100"); // Draw analogue meter at 0, 128
}


void loop() 
{
  static int d = 0;
  static uint32_t updateTime = 0;  

  if (millis() - updateTime >= LOOP_PERIOD) 
  {
    updateTime = millis();

    d += 4; if (d > 360) d = 0;

    // Create a Sine wave for testing, value is in range 0 - 100
    float value = 50.0 + 50.0 * sin((d + 0) * 0.0174532925);

    float current;
    current = mapValue(value, (float)0.0, (float)100.0, (float)0.0, (float)2.0);
    //Serial.print("I = "); Serial.print(current);
    amps.updateNeedle(current, 0);

    float voltage;
    voltage = mapValue(value, (float)0.0, (float)100.0, (float)0.0, (float)10.0);
    //Serial.print(", V = "); Serial.println(voltage);
    volts.updateNeedle(voltage, 0);
    
    float resistance;
    resistance = mapValue(value, (float)0.0, (float)100.0, (float)0.0, (float)100.0);
    //Serial.print(", R = "); Serial.println(resistance);
    ohms.updateNeedle(resistance, 0);
  }
}

float mapValue(float ip, float ipmin, float ipmax, float tomin, float tomax)
{
  return tomin + (((tomax - tomin) * (ip - ipmin))/ (ipmax - ipmin));
>>>>>>> dd85edcd506eddc2589a464303b6c8e6d3cab428
}
