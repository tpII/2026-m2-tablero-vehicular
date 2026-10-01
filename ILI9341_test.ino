#include <SPI.h>
#include <Adafruit_GFX.h>
#include <Adafruit_ST7789.h>

#define TFT_CS   15
#define TFT_DC   2
#define TFT_RST  4

Adafruit_ST7789 tft = Adafruit_ST7789(TFT_CS, TFT_DC, TFT_RST);

void setup() {
  Serial.begin(115200);

  tft.init(240, 320);
  tft.setRotation(1); 
  tft.invertDisplay(false);

  tft.fillScreen(ST77XX_BLACK);

  tft.setCursor(20, 50);
  tft.setTextColor(ST77XX_WHITE);
  tft.setTextSize(3);
  tft.println("Hola ESP32!");

  tft.setCursor(20, 100);
  tft.setTextColor(ST77XX_GREEN);
  tft.setTextSize(2);
  tft.println("Controlador ST7789");
}

void loop() {
  tft.fillRect(50, 150, 220, 50, ST77XX_RED);
  delay(1000);
  
  tft.fillRect(50, 150, 220, 50, ST77XX_BLUE);
  delay(1000);
}