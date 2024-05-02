#ifndef ConnectWiFi_H
#define ConnectWiFi_H

#include <WiFi.h>
#include <core/BTRPCProtocol.h>
#include <core/GunplaESPKit.h>

const auto SSID_KEY = F("SSID");
const auto PASSWORD_KEY = F("password");
const int WAIT_WIFI_DELAY = 500;

void handle_connect_wifi(BTRPCProtocol *proto, GunplaESPKit *gundam, uint32_t id, JsonObject &data) {
  if (!data.containsKey(SSID_KEY) || !data.containsKey(PASSWORD_KEY)) {
    Serial.println(F("Missing SSID or password key"));
    proto->reject(RPCResult::InvalidParams);
    return;
  }

  WiFi.disconnect(true, true);

  String ssid = data[SSID_KEY];
  String password = data[PASSWORD_KEY];

  Serial.printf("Setting WiFi credentials SSID: %s password: %s \n", ssid.c_str(), password.c_str());
  homeSpan.setWifiCredentials(ssid.c_str(), password.c_str());
  WiFi.begin(ssid.c_str(), password.c_str());

  // Wait for WiFi connection
  Serial.print("Connecting to WiFi");
  int countdown = 15 * (1000 / WAIT_WIFI_DELAY);
  while (WiFi.status() != WL_CONNECTED || countdown > 0) {
    Serial.print(".");
    delay(WAIT_WIFI_DELAY);
    countdown--;
  }
  Serial.println("Connected!");

  proto->ok();
}

#endif
