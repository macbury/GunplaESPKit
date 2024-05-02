#ifndef ReadAccessories_H
#define ReadAccessories_H

#include <core/BTRPCProtocol.h>
#include <core/GunplaESPKit.h>

void handle_read_accessories_config(BTRPCProtocol *proto, GunplaESPKit *gundam, uint32_t id, JsonObject &data) {
  if (!LittleFS.exists(GUNPLA_ACCESSORIES_CONFIG)) {
    Serial.printf("Missing configuration %s\n", GUNPLA_ACCESSORIES_CONFIG);
    proto->reject(RPCResult::NotFound);
    return;
  }

  Serial.printf("Loading raw bytes straight from %s ", GUNPLA_ACCESSORIES_CONFIG);
  File file = LittleFS.open(GUNPLA_ACCESSORIES_CONFIG, FILE_READ, false);
  Serial.printf("%i bytes\n", file.size());
  auto writer = proto->begin(file.size());

  Serial.println(file.available());
  while(file.available() > 0) {
    int byte = file.read();
    if (byte >= 0) {
      writer->write(byte);
    }
  }

  writer->close();
}

#endif
