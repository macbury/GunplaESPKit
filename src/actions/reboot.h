#ifndef Reboot_H
#define Reboot_H

#include <core/BTRPCProtocol.h>
#include <core/GunplaESPKit.h>

void handle_reboot(BTRPCProtocol *proto, GunplaESPKit *gundam, uint32_t id, JsonObject &data) {
  proto->ok();
  gundam->needRestart();
}

#endif
