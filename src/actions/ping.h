#ifndef HandlePing_H
#define HandlePing_H

#include <core/BTRPCProtocol.h>
#include <core/GunplaESPKit.h>

void handle_ping(BTRPCProtocol *proto, GunplaESPKit *gundam, uint32_t id, JsonObject &data) {
  proto->ping();
  proto->ok();
}

#endif
