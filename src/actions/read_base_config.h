#ifndef ReadConfig_H
#define ReadConfig_H

#include <core/BTRPCProtocol.h>
#include <core/GunplaESPKit.h>

void handle_read_base_config(BTRPCProtocol *proto, GunplaESPKit *gundam, uint32_t id, JsonObject &data) {
  if (!LittleFS.exists(GUNPLA_BASE_CONFIG)) {
    Serial.printf("Missing configuration %s\n", GUNPLA_BASE_CONFIG);
    proto->reject(RPCResult::NotFound);
    return;
  }

  Serial.printf("Loading raw bytes straight from %s ", GUNPLA_BASE_CONFIG);
  File file = LittleFS.open(GUNPLA_BASE_CONFIG, FILE_READ, false);
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
