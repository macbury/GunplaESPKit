#ifndef DimmableLed_H
#define DimmableLed_H

#include <HomeSpan.h>
#include "BaseLed.h"
#include <core/consts.h>

struct DimmableLed : MultiPinLed {
  SpanCharacteristic *level;

  DimmableLed(unsigned int uid, uint8_t pins[MAX_PINS], uint8_t pinCount, int brightness) : MultiPinLed(uid, pins, pinCount) {
    this->level = new Characteristic::Brightness(brightness, true);
    this->level->setRange(5,100,1);

    this->update();
  }

  void setState(bool state, int level) {
    this->power->setVal(state, true);
    this->level->setVal(level);
  }

  boolean update(){
    bool enabled = this->isOn();
    uint8_t state = enabled ? HIGH : LOW;
    int brightness = map(level->getNewVal(), 0, 100, 0, 1023);
    this->markAsDirty();

    for (uint8_t i = 0; i < this->pinCount; i++) {
      int ledPin = this->pins[i];

      if (ledPin > 0) {
        if (enabled) {
          Serial.printf("LED on Pin %d/%d: %s and brightness %i\n", ledPin, i, enabled ? "ON" : "OFF", brightness);
          analogWrite(ledPin, brightness);
        } else {
          Serial.printf("OFF led %d/%d\n", ledPin, i);
          analogWrite(ledPin, 0);
        }
      }
    }

    return true;
  } // update

  void toState(JsonObject &obj) {
    MultiPinLed::toState(obj);
    obj[F("b")] = this->level->getVal();
  }

  void dispose() {
    Serial.println("Disposed dimmable led");
  }

  AccessoryType type() {
    return AccessoryType::Dimmable;
  }
};

#endif
