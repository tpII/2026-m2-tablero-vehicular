#include <Arduino.h>

#include "TFT_eSPI/TFT_eSPI.h"

constexpr uint8_t DISPLAY_FONT = 4;
constexpr uint8_t DISPLAY_TEXT_SIZE = 2;
constexpr int DISPLAY_MARGIN = 10;

static TFT_eSPI tft;

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

static void PrintDisplay() {
  Serial.printf("Width: %d | Height: %d | Rotation: %d\n", tft.width(), tft.height(), tft.getRotation());
}
