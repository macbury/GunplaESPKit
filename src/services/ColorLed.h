#ifndef ColorLed_H
#define ColorLed_H

#include <HomeSpan.h>
#include <Adafruit_NeoPixel.h>
#include "BaseLed.h"

struct ColorLedStrip : DisposableLed {
  Adafruit_NeoPixel *strip{nullptr};
  uint8_t pin;

  ColorLedStrip(uint8_t pin, uint16_t count, neoPixelType type) : DisposableLed() {
    Serial.printf("Initialize NeoPixel Pin: %i and number of pixels: %i\n", pin, count);
    this->pin = pin;
    this->strip = new Adafruit_NeoPixel(count, pin, type);
    this->strip->begin();
    this->strip->setBrightness(255);
    this->strip->clear();
    this->strip->show();
  } // end constructor

  void loop() {
    // Serial.println("show");
    this->strip->show();// update the led
  }

  void dispose() {
    if (this->strip) {
      this->strip->clear();
      this->strip->updateLength(0);
      pinMode(this->pin, INPUT);
      Serial.println("Disposed strip");
    }
  }
};

/**
 * @brief Represents a colored LED that can control a part of the whole color strip.
 */
struct ColoredLed : BaseLed {
  Adafruit_NeoPixel *strip{nullptr};
  SpanCharacteristic *H;                       // reference to the Hue Characteristic
  SpanCharacteristic *S;                       // reference to the Saturation Characteristic
  SpanCharacteristic *V;                       // reference to the Brightness Characteristic
  uint8_t offset;
  uint8_t count;
  uint32_t color;

  ColoredLed(unsigned int uid, Adafruit_NeoPixel *strip, uint8_t offset, uint8_t count, int h, int s, int v) : BaseLed(uid) {
    this->H=new Characteristic::Hue(h, true);               // instantiate the Hue Characteristic with an initial value of 0 out of 360
    this->S=new Characteristic::Saturation(s, true);        // instantiate the Saturation Characteristic with an initial value of 0%
    this->V=new Characteristic::Brightness(v, true);        // instantiate the Brightness Characteristic with an initial value of 100%
    this->V->setRange(5,100,1);
    this->offset = offset;
    this->count = count;                         // sets the range of the Brightness to be from a min of 5%, to a max of 100%, in steps of 1%
    this->color = 0x000000;
    // https://github.com/HomeSpan/HomeSpan/blob/master/examples/10-RGB_LED/DEV_LED.h#L102

    this->strip = strip;
    this->update();
  }

  void loop() {
    // Serial.printf("Fill offset=%i count=%i color=%i", offset, count, color);
    // just set color every tick, perform color transition here
    this->strip->fill(color, offset, count);
  }

  void setState(bool state, int h, int s, int v) {
    this->power->setVal(state);
    this->H->setVal(h);
    this->S->setVal(s);
    this->V->setVal(v);
  }

  boolean update(){
    bool enabled = this->power->getNewVal();
    this->markAsDirty();

    Serial.printf("offset=%i count=%i", offset, count);
    if (enabled) {
      Serial.printf("CharsHSV=(%d,%d,%d)\n", this->H->getNewVal(), this->S->getNewVal(), this->V->getNewVal());

      uint16_t h = map(this->H->getNewVal(), 0, 360, 0, 65534);
      uint8_t s = map(this->S->getNewVal(), 0, 100, 0, 255);
      uint8_t v = map(this->V->getNewVal(), 0, 100, 0, 255);

      this->color = this->strip->ColorHSV(h,s,v);
      Serial.printf("Set color HSV=(%d,%d,%d) RGB=0x%X\n", h, s, v, color);
      // update only on startup
    } else {
      Serial.println("Set clear color to black");
      this->color = 0x000000;
    }

    return true;
  }

  void toState(JsonObject &obj) {
    BaseLed::toState(obj);

    obj[F("h")] = this->H->getVal();
    obj[F("s")] = this->S->getVal();
    obj[F("v")] = this->V->getVal();
  }

  AccessoryType type() {
    return AccessoryType::Colored;
  }
};

#endif
