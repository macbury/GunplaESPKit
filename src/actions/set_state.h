#ifndef SetState_H
#define SetState_H

#include <WiFi.h>
#include <core/BTRPCProtocol.h>
#include <core/GunplaESPKit.h>

const auto STATE_KEY        = F("sta");
const auto ID_KEY           = F("id");
const auto BRIGHTNESS_KEY   = F("b");

const auto HUE_KEY          = F("h");
const auto SATURATION_KEY   = F("s");
const auto VALUE_KEY        = F("v");

void handle_set_states(BTRPCProtocol *proto, GunplaESPKit *gundam, uint32_t id, JsonObject &data) {
  if (!data.containsKey(ID_KEY) || !data.containsKey(STATE_KEY)) {
    Serial.println(F("Missing id or sta"));
    proto->reject(RPCResult::InvalidParams);
    return;
  }

  unsigned int uid = data[ID_KEY];
  bool state = data[STATE_KEY];

  for (size_t i = 0; i < gundam->leds.size(); i++) {
    auto led = gundam->leds.get(i);

    if (auto baseLed = static_cast<BaseLed*>(led)) {
      if (baseLed->uid == uid) {
        Serial.printf("Found led with uid: %i\n", uid);

        if (baseLed->type() == AccessoryType::Switch) {
          auto onOff = static_cast<OnOffLed*>(led);
          Serial.printf("Set on off state to: %i\n", state);

          onOff->setState(state);
        } else if (baseLed->type() == AccessoryType::Dimmable) {
          auto dimmable = static_cast<DimmableLed*>(led);
          int brightness = data[BRIGHTNESS_KEY];

          Serial.printf("Set Dimmable state to: %i with brightness %i\n", state, brightness);
          dimmable->setState(state, brightness);
        } else if (baseLed->type() == AccessoryType::Colored) {
          auto colored = static_cast<ColoredLed*>(led);
          int h = data[HUE_KEY];
          int s = data[SATURATION_KEY];
          int v = data[VALUE_KEY];

          Serial.printf("Set Colored state to: %i with h: %i, s: %i, v: %i\n", state, h, s, v);
          colored->setState(state, h, s, v);
        }

        baseLed->update();
        baseLed->clean();
        proto->ok();
        return;
      }
    }
  }

  Serial.printf("Could not find led with uid: %i\n", uid);
  proto->reject(RPCResult::NotFound);
}

#endif
