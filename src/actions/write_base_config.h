#ifndef WriteConfig_H
#define WriteConfig_H

#include <core/BTRPCProtocol.h>
#include <core/GunplaESPKit.h>

const char * GUNPLA_TMP_BASE_CONFIG = "/base.tmp";

void handle_write_base_config(BTRPCProtocol *proto, GunplaESPKit *gundam, uint32_t id, JsonObject &data) {
  Serial.printf("Writing config into %s: ", GUNPLA_TMP_BASE_CONFIG);
  File file = LittleFS.open(GUNPLA_TMP_BASE_CONFIG, FILE_WRITE, true);
  auto size = serializeMsgPack(data, file);
  Serial.printf("%i bytes\n", size);
  file.flush();
  file.close();

  Serial.printf("Moving completed file from %s to %s\n ", GUNPLA_TMP_BASE_CONFIG, GUNPLA_BASE_CONFIG);
  LittleFS.rename(GUNPLA_TMP_BASE_CONFIG, GUNPLA_BASE_CONFIG);

  proto->ok();
  gundam->needRestart();
}

#endif
