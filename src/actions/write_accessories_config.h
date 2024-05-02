#ifndef WriteAccessories_H
#define WriteAccessories_H

#include <core/BTRPCProtocol.h>
#include <core/GunplaESPKit.h>

const char * GUNPLA_TMP_ACCESSORIES_CONFIG = "/accessories.tmp";

void handle_write_accessories_config(BTRPCProtocol *proto, GunplaESPKit *gundam, uint32_t id, JsonObject &data) {
  Serial.printf("Writing config into %s: ", GUNPLA_TMP_ACCESSORIES_CONFIG);
  File file = LittleFS.open(GUNPLA_TMP_ACCESSORIES_CONFIG, FILE_WRITE, true);
  auto size = serializeMsgPack(data, file);
  Serial.printf("%i bytes\n", size);
  file.flush();
  file.close();

  Serial.printf("Moving completed file from %s to %s\n ", GUNPLA_TMP_ACCESSORIES_CONFIG, GUNPLA_ACCESSORIES_CONFIG);
  LittleFS.rename(GUNPLA_TMP_ACCESSORIES_CONFIG, GUNPLA_ACCESSORIES_CONFIG);

  proto->ok();
  gundam->markForReload();
}

#endif
