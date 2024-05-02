#ifndef SystemInfo_H
#define SystemInfo_H

#include <core/BTRPCProtocol.h>
#include <core/GunplaESPKit.h>

void handle_system_info(BTRPCProtocol *proto, GunplaESPKit *gundam, uint32_t id, JsonObject &data) {
  DynamicJsonDocument response(1024);

  auto bt = response.createNestedObject(F("bluetooth"));
  uint8_t btMac[6];
  char macStr[18] = { 0 };
  esp_read_mac(btMac, ESP_MAC_BT);
  sprintf(macStr, "%02X:%02X:%02X:%02X:%02X:%02X", btMac[0], btMac[1], btMac[2], btMac[3], btMac[4], btMac[5]);
  bt[F("mac")] = String(macStr);
  bt[F("name")] = String(proto->deviceName);

  auto esp = response.createNestedObject(F("esp"));
  esp[F("md5")] = ESP.getSketchMD5();
  esp[F("model")] = ESP.getChipModel();
  esp[F("revision")] = ESP.getChipRevision();
  esp[F("board")] = String(ARDUINO_BOARD);
  esp[F("variant")] = String(ARDUINO_VARIANT);

  proto->accept(response);
}

#endif
