#include <Arduino.h>
#include <WiFi.h>

#include "../config.h"

static void InitializeWifi() {
  WiFi.persistent(false);
  WiFi.mode(WIFI_AP);
  WiFi.softAP(WIFI_SSID, WIFI_PASSWORD);
}

static bool IsWifiConnected() {
  return WiFi.softAPgetStationNum() > 0;
}

static void PrintWifi() {
  Serial.printf("WiFi: %s | IP: %s | Clients: %d\n", IsWifiConnected() ? "connected" : "disconnected", WiFi.softAPIP().toString().c_str(), WiFi.softAPgetStationNum());
}
