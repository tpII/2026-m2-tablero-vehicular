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

static float MotorStartScale(float percent) {
  constexpr float START_PWM_PERCENT = 57.0f;

  if (percent <= 0.0f) return 0.0f;
  return constrain(START_PWM_PERCENT + (percent / 100.0f) * (100.0f - START_PWM_PERCENT), 0.0f, 100.0f);
}
