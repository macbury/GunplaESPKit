#include <Arduino.h>
#include <HomeSpan.h>
#include <LinkedList.h>
#include <WiFi.h>
#include <services/BaseLed.h>
#include <services/OnOffLed.h>
#include <services/DimmableLed.h>
#include <services/ColorLed.h>
#include "services/ThemeSelector.h"
#include "consts.h"
#include "GKService.h"
#include "BTRPCProtocol.h"
#include "FirmwareUpdate.h"


#ifndef GunplaESPKit_H
#define GunplaESPKit_H

class GunplaESPKit {
private:
  bool _needRestart;
  bool recoveryMode;
  bool accessoriesDirty;
  BTRPCProtocol *proto;
  void handle(JsonVariant &json);
  unsigned int beginAccessory(JsonObject &blueprint);
  void buildOnOffAccessories(JsonArray &blueprints);
  void buildDimmableAccessories(JsonArray &blueprints);
  void buildColorAccessories(JsonArray &blueprints);
  void restart();
public:
  char name[64];
  int pin;
  char pairingCode[9];
  FirmwareUpdate *firmwareUpdate;
  LinkedList<GKService*> services;
  LinkedList<DisposableLed*> leds;

  GunplaESPKit(BTRPCProtocol *proto);
  ~GunplaESPKit();

  void markForReload();
  void act();
  bool load();
  bool reloadAccessories();
  void on(RPCCommand command, GKServiceFunction handler);
  void broadcastWiFiStatus();

  void enableRecoveryMode();
  void disableRecoveryMode();
  bool isRecoveryMode();
  void needRestart();
  void checkRecoveryMode();
};

GunplaESPKit::GunplaESPKit(BTRPCProtocol *proto) {
  this->accessoriesDirty = false;
  this->_needRestart = false;
  this->services = LinkedList<GKService*>();
  this->leds = LinkedList<DisposableLed*>();
  this->proto = proto;

  this->proto->onRPCCommand([&](uint8_t id, RPCCommand command, JsonVariant &json) {
    for (size_t i = 0; i < this->services.size(); i++){
      GKService *service = this->services.get(i);

      if (service->canHandle(command)) {
        service->handle(this->proto, this, id, json);
        return;
      }
    }
  });

  this->firmwareUpdate = new FirmwareUpdate(proto);
}

void GunplaESPKit::enableRecoveryMode() {
  Serial.println(F("Enable recovery mode"));
  File file = LittleFS.open(RECOVERY_FILE, FILE_WRITE, true);
  file.write(12);
  file.flush();
  file.close();
}

void GunplaESPKit::disableRecoveryMode() {
  Serial.println(F("Disabling recovery mode"));
  LittleFS.remove(RECOVERY_FILE);
}

void GunplaESPKit::checkRecoveryMode() {
  this->recoveryMode = LittleFS.exists(RECOVERY_FILE);
}

bool GunplaESPKit::isRecoveryMode() {
  return this->recoveryMode;
}

void GunplaESPKit::markForReload() {
  Serial.println(F("Marked accessories for reload"));
  this->accessoriesDirty = true;
}

void GunplaESPKit::act() {
  if (millis() > RESTART_INTERVAL) {
    Serial.println("Automatic restart...");
    this->_needRestart = true;
  }

  if (this->_needRestart) {
    Serial.println("Needs restart!");
    this->_needRestart = false;
    this->restart();
    return;
  }

  bool dirty = false;

  for (size_t i = 0; i < this->leds.size(); i++) {
    auto led =  this->leds.get(i);
    if (auto baseLed = static_cast<BaseLed*>(led)) {
      if (baseLed->isDirty()) {
        dirty = true;
      }
      baseLed->clean();
    }
  }

  if (dirty) {
    Serial.println("set state on proto to notify");
    this->proto->state->notify();
  }

  this->firmwareUpdate->loop();

  if (this->accessoriesDirty) {
    Serial.println(F("Reloading accessories..."));
    delay(1000);
    this->reloadAccessories();
    this->accessoriesDirty = false;
  }
}

void GunplaESPKit::broadcastWiFiStatus() {
  Serial.println(F("Updating WiFi Characteristic"));
  //https://github.com/HomeSpan/HomeSpan/blob/831d3640cc9e2f0ff60c870d3a93505d3cd4adf6/src/Network.h

  this->proto->setWiFiStatus(
    WiFi.isConnected(),
    WiFi.SSID().c_str(),
    WiFi.RSSI(),
    WiFi.macAddress().c_str(),
    WiFi.localIP().toString().c_str(),
    WiFi.getHostname()
  );
}

void GunplaESPKit::on(RPCCommand command, GKServiceFunction handler) {
  Serial.println(F("[GunplaESPKit] registered service"));
  services.add(new GKService(command, handler));
}

GunplaESPKit::~GunplaESPKit() {
}

void GunplaESPKit::needRestart() {
  this->_needRestart = true;
}

void GunplaESPKit::restart() {
  Serial.println(F("[GunplaESPKit] Restarting device..."));
  // Serial.flush();
  this->disableRecoveryMode();
  this->proto->cleanup();
  WiFi.disconnect();
  this->proto->disconnect();
  delay(1000);
  NimBLEDevice::deinit(false);
  delay(1000);
  ESP.restart();
}

bool GunplaESPKit::load() {
  Serial.printf("Loading config from %s\n", GUNPLA_BASE_CONFIG);
  File file = LittleFS.open(GUNPLA_BASE_CONFIG, FILE_READ, false);

  DynamicJsonDocument config(1024);
  DeserializationError error = deserializeMsgPack(config, file);
  if (error) {
    Serial.print(F("Failed to read file, using default configuration: "));
    Serial.println(error.c_str());
  }

  auto configName = config[F("name")];
  if (configName.isNull()) {
    uint64_t chip_id = ESP.getEfuseMac(); // The chip ID is essentially its MAC address(length: 6 bytes).
    uint16_t chip = (uint16_t)(chip_id >> 32);
    snprintf(this->name, 23, "%02X", chip);
  } else {
    strlcpy(this->name, configName, sizeof(this->name));
  }

  this->pin = config[F("pin")] | 123456;
  strlcpy(this->pairingCode, config[F("pairingCode")] | "46637726", sizeof(this->pairingCode));
  Serial.printf("[GunplaESPKit] Config name %s, pairing code: %s, pin: %i\n", this->name, this->pairingCode, this->pin);

  homeSpan.setPairingCode(this->pairingCode);
  homeSpan.begin(Category::Bridges, this->name, "GunplaESPKit", "GunplaESPKit");

  return true;
}

bool GunplaESPKit::reloadAccessories() {
  Serial.printf("Clearing %i leds\n", this->leds.size());
  for (size_t i = 0; i < this->leds.size(); i++) {
    auto led = this->leds.get(i);
    led->dispose();
  }
  this->leds.clear();

  Serial.printf("Loading %s\n", GUNPLA_ACCESSORIES_CONFIG);
  File file = LittleFS.open(GUNPLA_ACCESSORIES_CONFIG, FILE_READ, false);

  DynamicJsonDocument config(6048);
  DeserializationError error = deserializeMsgPack(config, file);
  if (error) {
    Serial.print(F("Failed to read file, using default configuration: "));
    Serial.println(error.c_str());
  }

  Serial.println(F("Starting hub"));

  // homeSpan.deleteAccessory(1);
  new SpanAccessory(0);
    new Service::AccessoryInformation();
      new Characteristic::Identify();
      new Characteristic::Manufacturer(MANUFACTURER);
      new Characteristic::Model("GunplaESPKit");
      new Characteristic::FirmwareRevision(VERSION);
      new Characteristic::Version(VERSION);
      new Characteristic::Name(this->name);
      new Characteristic::AccessoryFlags();

  Serial.println(F("Configuring effects selector"));
  homeSpan.deleteAccessory(EFFECTS_ACCESSORY_AID);

  new SpanAccessory(EFFECTS_ACCESSORY_AID);
    new Service::AccessoryInformation();
      new Characteristic::Identify();
      new Characteristic::Model(this->name);
      new Characteristic::AccessoryFlags();
      new ThemeSelector(this->name);

  JsonArray usedIds = config["usedIds"];

  if (usedIds.isNull()) {
    Serial.println(F("Missing used ids field!"));
    return false;
  } else {
    Serial.println("Removing accessories: ");
    for (size_t i = 0; i < usedIds.size(); i++) {
      auto aid = usedIds[i].as<uint32_t>();
      Serial.printf("%i, ", aid);
      homeSpan.deleteAccessory(aid);
    }
    Serial.println();
  }

  Serial.println(F("Loading switches"));
  if (config[F("switch")].is<JsonArray>()) {
    JsonArray blueprints = config[F("switch")];
    this->buildOnOffAccessories(blueprints);
  }

  Serial.println(F("Loading dimmable"));
  if (config[F("dimmable")].is<JsonArray>()) {
    JsonArray blueprints = config[F("dimmable")];
    this->buildDimmableAccessories(blueprints);
  }

  if (config[F("colored")].is<JsonArray>()) {
    JsonArray blueprints = config[F("colored")];
    this->buildColorAccessories(blueprints);
  }

  Serial.println(F("Updating database"));
  if (homeSpan.updateDatabase(true)) {
    Serial.println(F("Accessories Database updated.  New configuration number broadcasted..."));
  } else {
    Serial.println(F("Nothing to update - no changes were made!"));
  }

  return true;
}

unsigned int GunplaESPKit::beginAccessory(JsonObject &blueprint) {
  unsigned int uid = blueprint[F("id")].as<unsigned int>();

  char name[64];
  char ledName[32];
  strlcpy(ledName, blueprint[F("name")], sizeof(ledName));
  sprintf(name,"%s %s", this->name, ledName);

  uint32_t id = uid + AID;
  char sNum[32];
  sprintf(sNum,"%0.10d", id);

  // Serial.printf("Removing accessory: %i\n", id);
  // you need to delete accessory before adding it again.
  // homeSpan.deleteAccessory(id);

  Serial.printf("Creating accessory: %s\n", name);
  new SpanAccessory(id);
    new Service::AccessoryInformation();
      new Characteristic::Identify();
      new Characteristic::Name(name);
      new Characteristic::Model(this->name);
      new Characteristic::Manufacturer(MANUFACTURER);
      new Characteristic::FirmwareRevision(VERSION);
      new Characteristic::SerialNumber(sNum);

  return uid;
}

void GunplaESPKit::buildOnOffAccessories(JsonArray &blueprints) {
  Serial.printf("Found on off lights %d\n", blueprints.size());

  for (size_t i = 0; i < blueprints.size(); i++) {
    JsonObject blueprint = blueprints[i];

    uint8_t pins[MAX_PINS] = { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 };
    int copied = copyArray(blueprint[F("pins")], pins);
    Serial.printf("Copied pins %d\n", copied);
    auto uid = this->beginAccessory(blueprint);
      this->leds.add(new OnOffLed(uid, pins, copied));
  }
}

void GunplaESPKit::buildDimmableAccessories(JsonArray &blueprints) {
  Serial.printf("Found dimmable lights %d\n", blueprints.size());

  for (size_t i = 0; i < blueprints.size(); i++) {
    JsonObject blueprint = blueprints[i];

    uint8_t pins[MAX_PINS] = { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 };
    int copied = copyArray(blueprint[F("pins")], pins);
    int brightness = blueprint[F("brightness")] | 100;
    Serial.printf("Copied pins %d\n", copied);
    auto uid = this->beginAccessory(blueprint);
      this->leds.add(new DimmableLed(uid, pins, copied, brightness));
  }
}

void GunplaESPKit::buildColorAccessories(JsonArray &blueprints) {
  Serial.printf("Found color lights %d\n", blueprints.size());

  for (size_t i = 0; i < blueprints.size(); i++) {
    JsonObject blueprint = blueprints[i];

    int count = blueprint[F("count")] | 1;
    uint8_t pin = blueprint[F("pin")] | 13;
    uint16_t speed = blueprint[F("speed")] | NEO_KHZ800;
    uint16_t colorMode = blueprint[F("colorMode")] | NEO_GRB;

    JsonArray lights = blueprint[F("lights")];

    if (lights.isNull()) {
      Serial.println(F("Missing lights key on colored"));
      continue;
    }

    this->beginAccessory(blueprint);
      auto stripLed = new ColorLedStrip(pin, count, colorMode + speed);

    for (size_t a = 0; a < lights.size(); a++) {
      JsonObject lightBlueprint = lights[a];
      uint8_t offset = lightBlueprint[F("offset")] | 0;
      uint8_t count = lightBlueprint[F("count")] | 1;

      int h = lightBlueprint[F("h")] | 0x0;
      int s = lightBlueprint[F("s")] | 0x0;
      int v = lightBlueprint[F("v")] | 100;

      unsigned int colorLightUid = this->beginAccessory(lightBlueprint);
        this->leds.add(new ColoredLed(colorLightUid, stripLed->strip, offset, count, h, s, v));
      // Serial.printf("Color light uid: %i\n", colorLightUid);
    }

    this->leds.add(stripLed); // add lead after all rgb lights, loop function will run show
  }
}

#endif
