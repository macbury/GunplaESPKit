#ifndef AllStates_H
#define AllStates_H

#include <WiFi.h>
#include <core/BTRPCProtocol.h>
#include <core/GunplaESPKit.h>

void handle_all_states(BTRPCProtocol *proto, GunplaESPKit *gundam, uint32_t id, JsonObject &data) {
  DynamicJsonDocument response(2048);
  auto states = response.createNestedArray(F("accessories"));

  for (size_t i = 0; i < gundam->leds.size(); i++) {
    auto led = gundam->leds.get(i);

    if (auto ledState = static_cast<DisposableLed*>(led)) {
      auto state = states.createNestedObject();
      ledState->toState(state);
    }
  }

  proto->accept(response);
}

#endif
