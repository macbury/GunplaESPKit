#ifndef ThemeSelector_H
#define ThemeSelector_H

#include <HomeSpan.h>
#include <core/consts.h>

// HomeSpan does not currently support effects selection on lights. To emulate effect selection, we create a fake TV. Each HDMI source can represent a different effect.
struct ThemeSelector : Service::Television {
  char selectorName[32];
  SpanCharacteristic *active = new Characteristic::Active(1); // off by default
  SpanCharacteristic *activeID = new Characteristic::ActiveIdentifier(1); // select none
  SpanCharacteristic *settingsKey = new Characteristic::PowerModeSelection();
  SpanCharacteristic *remoteKey = new Characteristic::RemoteKey();

  ThemeSelector(const char *name) : Service::Television() {
    sprintf(selectorName,"%s Theme", name);

    new Characteristic::Name(selectorName);
    new Characteristic::ConfiguredName(selectorName);
     // Name of TV
    Serial.printf("Configured TV: %s\n", selectorName);

    SpanService *noneSource = new Service::InputSource();    // Source included in Selection List, but excluded from Settings Screen
      new Characteristic::ConfiguredName("None");
      new Characteristic::Identifier(1);
    this->addLink(noneSource);

    // SpanService *fadeSource = new Service::InputSource();    // Source included in Selection List, but excluded from Settings Screen
    //   new Characteristic::ConfiguredName("Fade");
    //   new Characteristic::Identifier(2);

    // this->addLink(fadeSource);
  }

  boolean update() override {
    //https://github.com/HomeSpan/HomeSpan/blob/e118061cff59c88ade0d8f17ebd7d508de7ccab5/examples/Other%20Examples/Television/Television.ino#L34
    if(active->updated()){
      Serial.printf("Set TV Power to: %s\n",active->getNewVal()?"ON":"OFF");
    }

    if(activeID->updated()){
      Serial.printf("Set Input Source to HDMI-%d\n",activeID->getNewVal());
    }

    if(settingsKey->updated()){
      Serial.printf("Received request to \"View TV Settings\"\n");
    }

    if(remoteKey->updated()){
      Serial.printf("Remote Control key pressed: ");
      switch(remoteKey->getNewVal()){
        case 4:
          Serial.printf("UP ARROW\n");
          break;
        case 5:
          Serial.printf("DOWN ARROW\n");
          break;
        case 6:
          Serial.printf("LEFT ARROW\n");
          break;
        case 7:
          Serial.printf("RIGHT ARROW\n");
          break;
        case 8:
          Serial.printf("SELECT\n");
          break;
        case 9:
          Serial.printf("BACK\n");
          break;
        case 11:
          Serial.printf("PLAY/PAUSE\n");
          break;
        case 15:
          Serial.printf("INFO\n");
          break;
        default:
          Serial.print("UNKNOWN KEY\n");
      }
    }

    return(true);
  }
};

#endif
