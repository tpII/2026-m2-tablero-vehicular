#include <Arduino.h>

static void AddJson(char *json, size_t size, const char *key, float value, int decimals) {
  size_t length = strlen(json);
  const char *separator = length == 0 ? "{" : ",";
  if (isfinite(value)) snprintf(json + length, size - length, "%s\"%s\":%.*f", separator, key, decimals, value);
  else snprintf(json + length, size - length, "%s\"%s\":null", separator, key);
}

static void CloseJson(char *json, size_t size) {
  size_t length = strlen(json);
  snprintf(json + length, size - length, "}");
}
