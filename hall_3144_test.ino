// ESP32 Hall 3144 Sensor Test

const int HALL_PIN = 4;
volatile bool magnetDetected = false;
unsigned long lastInterrupt = 0;

void IRAM_ATTR hallISR() {
  unsigned long now = millis();
  if (now - lastInterrupt > 50) { // Debounce 50ms
    magnetDetected = true;
    lastInterrupt = now;
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(HALL_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(HALL_PIN), hallISR, FALLING);
  Serial.println("Hall 3144 Test Started");
  Serial.println("Acercar iman al sensor...");
}

void loop() {
  if (magnetDetected) {
    Serial.println(">>> IMAN DETECTADO <<<");
    magnetDetected = false;
  }
  
  // Lectura continua cada 500ms
  static unsigned long lastRead = 0;
  if (millis() - lastRead > 500) {
    int state = digitalRead(HALL_PIN);
    Serial.printf("Estado pin: %s\n", state == LOW ? "IMAN (LOW)" : "SIN IMAN (HIGH)");
    lastRead = millis();
  }
}