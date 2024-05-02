#ifndef ListWifi_H
#define ListWifi_H

#include <WiFi.h>
#include <core/BTRPCProtocol.h>
#include <core/GunplaESPKit.h>

void handle_list_wifi(BTRPCProtocol *proto, GunplaESPKit *gundam, uint32_t id, JsonObject &data) {
  WiFi.disconnect();

  DynamicJsonDocument response(1024);
  int numberOfNetworks = WiFi.scanNetworks();
  WiFi.begin();
  auto networks = response.createNestedArray(F("networks"));
  Serial.printf("Found: %i networks\n", numberOfNetworks);

  for (int i = 0; i < numberOfNetworks; ++i) {
    auto network = networks.createNestedObject();
    Serial.print(F("[ScanWiFiHandler] Fetching network info: "));
    Serial.println(i);
    network[F("id")] = i;
    network[F("SSID")] = WiFi.SSID(i);
    network[F("RSSI")] = WiFi.RSSI(i);
  }

  proto->accept(response);
  gundam->broadcastWiFiStatus();
}

#endif
