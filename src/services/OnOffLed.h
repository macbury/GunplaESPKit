#ifndef OnOffLed_H
#define OnOffLed_H

#include <HomeSpan.h>
#include "BaseLed.h"
#include <core/consts.h>

struct OnOffLed : MultiPinLed {
  OnOffLed(unsigned int uid, uint8_t pins[MAX_PINS], uint8_t pinCount) : MultiPinLed(uid, pins, pinCount){
    this->update();
  } // end constructor

  void setState(bool state) {
    this->power->setVal(state, true);
  }

  boolean update(){
    uint8_t state = power->getNewVal() ? HIGH : LOW;
    this->markAsDirty();

    for (int i = 0; i < this->pinCount; i++) {
      uint8_t ledPin = this->pins[i];
      if (ledPin > 0) {
        Serial.printf("LED on Pin %d/%d: %s\n", ledPin, i, state ? "ON" : "OFF");
        digitalWrite(ledPin, state);
      }
    }

    Serial.printf("Updated led %i with state %i", uid, state);

    return true;
  } // update

  void dispose() {
    Serial.println("Disposed switch led");
  }

  AccessoryType type() {
    return AccessoryType::Switch;
  }
};

#endif
