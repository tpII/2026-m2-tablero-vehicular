#include <Arduino.h>

#include "../config.h"
#include "TFT_eSPI/TFT_eSPI.h"

constexpr uint8_t DISPLAY_FONT = 4;
constexpr uint8_t DISPLAY_TEXT_SIZE = 2;
constexpr int DISPLAY_MARGIN = 10;

constexpr int GAUGE_PWM = 0;
constexpr int GAUGE_SPEED = 1;
constexpr int GAUGE_CURRENT = 2;
constexpr int GAUGE_COUNT = 3;
constexpr int GAUGE_RADIUS = 100;
constexpr int GAUGE_THICKNESS = 18;
constexpr int GAUGE_CENTER_OFFSET_Y = 10;
constexpr int GAUGE_UNIT_OFFSET_Y = 40;
constexpr int GAUGE_TITLE_OFFSET_Y = 30;
constexpr int GAUGE_DOT_RADIUS = 4;
constexpr int GAUGE_DOT_SPACING = 16;
constexpr uint32_t GAUGE_START_ANGLE = 60;
constexpr uint32_t GAUGE_END_ANGLE = 300;
constexpr uint16_t GAUGE_TRACK_COLOR = 0x39E7;
constexpr uint8_t GAUGE_VALUE_FONT = 7;
constexpr uint8_t GAUGE_LABEL_FONT = 4;

struct DisplayGauge {
  const char *title;
  const char *unit;
  float maximum;
  uint8_t decimals;
  uint16_t color;
};

static const DisplayGauge displayGauges[GAUGE_COUNT] = {
  {"PWM", "%", 100.0f, 1, TFT_GREEN},
  {"Velocidad", "m/s", 5.0f, 2, TFT_CYAN},
  {"Corriente", "mA", 1000.0f, 0, TFT_ORANGE},
};

static TFT_eSPI tft;
static float gaugeValues[GAUGE_COUNT];
static int gaugeIndex;
static int gaugeAngle = -1;
static unsigned long gaugeShownMs;

static void InitializeDisplay(uint8_t rotation) {
  tft.init();
  tft.setRotation(rotation);
  tft.fillScreen(TFT_BLACK);
}

static void ClearDisplay() {
  tft.fillScreen(TFT_BLACK);
}

static void DrawDisplayTest() {
  int h = tft.height() / 4;
  tft.fillRect(0, 0, tft.width(), h, TFT_RED);
  tft.fillRect(0, h, tft.width(), h, TFT_GREEN);
  tft.fillRect(0, h * 2, tft.width(), h, TFT_BLUE);
  tft.fillRect(0, h * 3, tft.width(), tft.height() - h * 3, TFT_WHITE);
}

static void ShowDisplayText(const char *text) {
  tft.setTextColor(TFT_WHITE, TFT_BLACK);
  tft.setTextSize(DISPLAY_TEXT_SIZE);
  tft.setTextPadding(tft.width() - DISPLAY_MARGIN);
  tft.drawString(text, DISPLAY_MARGIN, DISPLAY_MARGIN, DISPLAY_FONT);
}

static void ShowDisplayPercent(float percent) {
  char text[16];
  snprintf(text, sizeof(text), "%5.1f %%", percent);
  ShowDisplayText(text);
}

static int GaugeCenterX() {
  return tft.width() / 2;
}

static int GaugeCenterY() {
  return tft.height() / 2 + GAUGE_CENTER_OFFSET_Y;
}

static int GaugeAngle(float value, float maximum) {
  float ratio = constrain(value / maximum, 0.0f, 1.0f);
  return GAUGE_START_ANGLE + ratio * (GAUGE_END_ANGLE - GAUGE_START_ANGLE) + 0.5f;
}

static void DrawGaugeArc(int angle) {
  const DisplayGauge &gauge = displayGauges[gaugeIndex];
  int x = GaugeCenterX();
  int y = GaugeCenterY();
  int innerRadius = GAUGE_RADIUS - GAUGE_THICKNESS;
  tft.drawArc(x, y, GAUGE_RADIUS, innerRadius, GAUGE_START_ANGLE, angle, gauge.color, TFT_BLACK);
  tft.drawArc(x, y, GAUGE_RADIUS, innerRadius, angle, GAUGE_END_ANGLE, GAUGE_TRACK_COLOR, TFT_BLACK);
}

static void DrawGaugeValue() {
  const DisplayGauge &gauge = displayGauges[gaugeIndex];
  tft.setTextSize(1);
  tft.setTextDatum(MC_DATUM);
  tft.setTextColor(TFT_WHITE, TFT_BLACK);
  tft.setTextPadding(tft.textWidth("888.8", GAUGE_VALUE_FONT));
  tft.drawFloat(gaugeValues[gaugeIndex], gauge.decimals, GaugeCenterX(), GaugeCenterY(), GAUGE_VALUE_FONT);
  tft.setTextPadding(0);
  tft.setTextDatum(TL_DATUM);
}

static void DrawGaugeLabels() {
  const DisplayGauge &gauge = displayGauges[gaugeIndex];
  tft.setTextSize(1);
  tft.setTextDatum(MC_DATUM);
  tft.setTextColor(gauge.color, TFT_BLACK);
  tft.drawString(gauge.unit, GaugeCenterX(), GaugeCenterY() + GAUGE_UNIT_OFFSET_Y, GAUGE_LABEL_FONT);
  tft.setTextColor(TFT_WHITE, TFT_BLACK);
  tft.drawString(gauge.title, GaugeCenterX(), tft.height() - GAUGE_TITLE_OFFSET_Y, GAUGE_LABEL_FONT);
  tft.setTextDatum(TL_DATUM);
}

static void DrawGaugeDots() {
  int x = GaugeCenterX() - GAUGE_DOT_SPACING * (GAUGE_COUNT - 1) / 2;
  int y = tft.height() - GAUGE_DOT_RADIUS * 2;
  for (int i = 0; i < GAUGE_COUNT; i++) {
    tft.fillCircle(x + i * GAUGE_DOT_SPACING, y, GAUGE_DOT_RADIUS, i == gaugeIndex ? TFT_WHITE : GAUGE_TRACK_COLOR);
  }
}

static void DrawGauge() {
  int angle = GaugeAngle(gaugeValues[gaugeIndex], displayGauges[gaugeIndex].maximum);
  if (angle != gaugeAngle) DrawGaugeArc(angle);
  gaugeAngle = angle;
  DrawGaugeValue();
}

static void ShowGauge(int index) {
  gaugeIndex = (index % GAUGE_COUNT + GAUGE_COUNT) % GAUGE_COUNT;
  gaugeAngle = -1;
  gaugeShownMs = millis();
  ClearDisplay();
  DrawGaugeLabels();
  DrawGaugeDots();
  DrawGauge();
}

static void ShowDisplayGauges(float pwmPercent, float speedMetersPerSecond, float currentMilliamps) {
  gaugeValues[GAUGE_PWM] = pwmPercent;
  gaugeValues[GAUGE_SPEED] = speedMetersPerSecond;
  gaugeValues[GAUGE_CURRENT] = currentMilliamps;
  DrawGauge();
}

static void UpdateDisplayCycle() {
  if (millis() - gaugeShownMs >= DISPLAY_CYCLE_MS) ShowGauge(gaugeIndex + 1);
}

static void PrintDisplay() {
  Serial.printf("Width: %d | Height: %d | Rotation: %d | Gauge: %d\n", tft.width(), tft.height(), tft.getRotation(), gaugeIndex);
}
