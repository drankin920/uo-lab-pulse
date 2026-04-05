/**
 * UO Lab Pulse — ESP32 Sensor Firmware
 *
 * Posts temperature and pressure readings to Firebase Firestore
 * every 5 seconds via the REST API.
 *
 * Required Libraries (install via Arduino IDE Library Manager):
 *   - ArduinoJson (by Benoit Blanchon) v7+
 *   - WiFi.h (built-in with ESP32 board package)
 *   - HTTPClient.h (built-in with ESP32 board package)
 *   - Your sensor library (e.g., Adafruit_BME680, DHT, etc.)
 *
 * Configuration:
 *   Edit the constants below to match your WiFi network and
 *   Firebase project. The FIREBASE_API_KEY and PROJECT_ID come
 *   from Firebase Console > Project Settings > Web app config.
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <time.h>

// ─── CONFIGURATION ──────────────────────────────────────────────
// WiFi credentials
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Firebase project settings
const char* FIREBASE_PROJECT_ID = "YOUR_PROJECT_ID";
const char* FIREBASE_API_KEY    = "YOUR_API_KEY";

// Device identity
const char* DEVICE_ID = "esp32-lab-01";

// Posting interval in milliseconds (5 seconds)
const unsigned long POST_INTERVAL_MS = 5000;

// Sensor pin configuration — adjust for your hardware
// Example: DHT22 on GPIO 4, or BME680 on I2C (SDA=21, SCL=22)
const int SENSOR_PIN = 4;

// ─── GLOBALS ────────────────────────────────────────────────────
unsigned long lastPostTime = 0;
int consecutiveFailures = 0;
const int MAX_FAILURES_BEFORE_RESTART = 20;

// Build the Firestore REST API URL
String getFirestoreUrl() {
  return String("https://firestore.googleapis.com/v1/projects/") +
         FIREBASE_PROJECT_ID +
         "/databases/(default)/documents/readings?key=" +
         FIREBASE_API_KEY;
}

// ─── SENSOR READING ─────────────────────────────────────────────
// TODO: Replace this stub with your actual sensor code.
// The function should return true on success, false on failure.

bool readSensor(float &temperature, float &pressure) {
  // ---- STUB: Replace with real sensor code ----
  // Example for DHT22:
  //   #include "DHT.h"
  //   DHT dht(SENSOR_PIN, DHT22);
  //   temperature = dht.readTemperature();
  //   if (isnan(temperature)) return false;
  //
  // Example for BME680:
  //   #include <Adafruit_BME680.h>
  //   Adafruit_BME680 bme;
  //   if (!bme.performReading()) return false;
  //   temperature = bme.temperature;
  //   pressure = bme.pressure / 100.0; // Pa to hPa

  // Placeholder: simulated data for testing
  temperature = 22.5 + random(-100, 100) / 100.0;
  pressure = 1013.25 + random(-500, 500) / 100.0;
  return true;
}

// ─── WIFI ───────────────────────────────────────────────────────

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.print("WiFi connected. IP: ");
    Serial.println(WiFi.localIP());
    consecutiveFailures = 0;
  } else {
    Serial.println();
    Serial.println("WiFi connection failed!");
  }
}

// ─── FIRESTORE POST ─────────────────────────────────────────────

bool postToFirestore(float temperature, float pressure) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected, skipping POST");
    return false;
  }

  HTTPClient http;
  String url = getFirestoreUrl();

  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  // Build Firestore REST API document payload
  // Firestore REST API requires a specific nested format for field values
  JsonDocument doc;
  JsonObject fields = doc["fields"].to<JsonObject>();

  fields["device_id"]["stringValue"] = DEVICE_ID;
  fields["temperature"]["doubleValue"] = temperature;
  fields["pressure"]["doubleValue"] = pressure;
  fields["unit_temp"]["stringValue"] = "Celsius";
  fields["unit_pressure"]["stringValue"] = "hPa";

  // Include ISO 8601 timestamp from NTP-synced clock
  // Firestore REST API accepts timestampValue in RFC 3339 format
  struct tm timeinfo;
  char timeBuf[30];
  if (getLocalTime(&timeinfo)) {
    strftime(timeBuf, sizeof(timeBuf), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
  } else {
    // Fallback: use a zero timestamp (should not happen with NTP sync)
    strcpy(timeBuf, "1970-01-01T00:00:00Z");
  }
  fields["timestamp"]["timestampValue"] = timeBuf;

  String payload;
  serializeJson(doc, payload);

  Serial.print("POST to Firestore... ");
  int httpCode = http.POST(payload);

  bool success = (httpCode == 200 || httpCode == 201);

  if (success) {
    Serial.println("OK (" + String(httpCode) + ")");
    consecutiveFailures = 0;
  } else {
    Serial.println("FAILED (" + String(httpCode) + ")");
    String response = http.getString();
    Serial.println("Response: " + response);
    consecutiveFailures++;
  }

  http.end();
  return success;
}

// ─── SETUP ──────────────────────────────────────────────────────

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println();
  Serial.println("=== UO Lab Pulse — ESP32 Sensor ===");
  Serial.print("Device ID: ");
  Serial.println(DEVICE_ID);
  Serial.print("Post interval: ");
  Serial.print(POST_INTERVAL_MS);
  Serial.println("ms");
  Serial.println();

  // Initialize random seed for stub sensor
  randomSeed(analogRead(0));

  // TODO: Initialize your sensor here
  // Example: dht.begin();
  // Example: bme.begin();

  connectWiFi();

  // Sync NTP time (required for accurate timestamps)
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  Serial.print("Syncing NTP time");
  struct tm timeinfo;
  int ntpAttempts = 0;
  while (!getLocalTime(&timeinfo) && ntpAttempts < 20) {
    Serial.print(".");
    delay(500);
    ntpAttempts++;
  }
  Serial.println();
  if (ntpAttempts < 20) {
    Serial.println("NTP time synced");
  } else {
    Serial.println("NTP sync failed — timestamps may be inaccurate");
  }
}

// ─── LOOP ───────────────────────────────────────────────────────

void loop() {
  // Reconnect WiFi if dropped
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected, reconnecting...");
    connectWiFi();
  }

  // Safety: restart ESP32 after too many consecutive failures
  if (consecutiveFailures >= MAX_FAILURES_BEFORE_RESTART) {
    Serial.println("Too many failures, restarting ESP32...");
    ESP.restart();
  }

  unsigned long now = millis();
  if (now - lastPostTime >= POST_INTERVAL_MS) {
    lastPostTime = now;

    float temperature, pressure;

    if (readSensor(temperature, pressure)) {
      Serial.print("Temp: ");
      Serial.print(temperature, 2);
      Serial.print(" °C | Pressure: ");
      Serial.print(pressure, 2);
      Serial.println(" hPa");

      postToFirestore(temperature, pressure);
    } else {
      Serial.println("Sensor read failed, skipping this cycle");
    }
  }

  // Small delay to prevent watchdog timeout
  delay(10);
}
