#include <Arduino.h>
#include <WiFi.h>

#include "../config.h"

static void InitializeWifi() {
  WiFi.persistent(false);
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
}

static bool IsWifiConnected() {
  return WiFi.status() == WL_CONNECTED;
}

static void PrintWifi() {
  Serial.printf("WiFi: %s | IP: %s | RSSI: %d dBm\n", IsWifiConnected() ? "connected" : "disconnected", WiFi.localIP().toString().c_str(), WiFi.RSSI());
}
