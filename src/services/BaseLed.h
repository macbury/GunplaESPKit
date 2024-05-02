#ifndef BaseLed_H
#define BaseLed_H

#include <HomeSpan.h>
#include <core/consts.h>

struct DisposableLed : Service::LightBulb {
  SpanCharacteristic *power;

  DisposableLed() : Service::LightBulb(){}

  virtual void dispose() {};

  /// @brief Store current state, this is used by web ui
  /// @param doc
  virtual void toState(JsonObject &obj) {
  }
};

enum AccessoryType {
  Unknown,
  Switch,
  Dimmable,
  Colored
};

struct BaseLed : DisposableLed {
  SpanCharacteristic *power;
  unsigned int uid;
  bool dirty;

  virtual AccessoryType type() {
    return AccessoryType::Unknown;
  }

  /// @brief Store current state, this is used by web ui
  /// @param doc
  virtual void toState(JsonObject &obj) {
    obj[F("sta")] = this->power->getVal<bool>();
    obj[F("id")] = this->uid;
    // store power state
  }

  BaseLed(unsigned int uid) : DisposableLed() {
    this->power = new Characteristic::On(true, true);
    this->uid = uid;
    this->dirty = true;
  }

  void markAsDirty() {
    Serial.println("State changed, ready to push");
    this->dirty = true;
  }

  bool isDirty() {
    return this->dirty;
  }

  void clean() {
    this->dirty = false;
  }

  boolean isOn() {
    return power->getNewVal();
  }
};

struct MultiPinLed : BaseLed {
  uint8_t pins[MAX_PINS];
  uint8_t pinCount;

  MultiPinLed(unsigned int uid, uint8_t pins[MAX_PINS], uint8_t pinCount) : BaseLed(uid){
    Serial.printf("Initializing MultiPinLed: %i\n", pinCount);
    this->uid = uid;
    this->pinCount = pinCount;

    for (size_t i = 0; i < MAX_PINS; i++) {
      this->pins[i] = 0;
    }

    for (size_t i = 0; i < this->pinCount; i++) {
      Serial.printf("Configuring LED on index %i", i);
      byte pin = (uint8_t)pins[i];
      Serial.printf(" with pin: %i\n", pin);
      if (pin > 0) {
        this->pins[i] = pin;
        pinMode(pin, OUTPUT);
      } else {
        break;
      }
    }
  };

  virtual void toState(JsonObject &obj) {
    BaseLed::toState(obj);
  }

  virtual AccessoryType type() {
    return BaseLed::type();
  }
};

#endif
