#ifndef FirmwareUpdate_H
#define FirmwareUpdate_H

#include <Arduino.h>
#include <ArduinoJson.h>
#include <NimBLEDevice.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <Update.h>
#include "BTRPCProtocol.h"
#include "consts.h"

enum UpdateState {
  Pending = 0,
  Downloading = 1,
  Done = 2,
  Failure = 3
};

class FirmwareUpdate {
private:
  UpdateState state;
  int progress;
  WiFiClientSecure *client;
  HTTPClient *http;
  BTRPCProtocol *protocol;
public:
  FirmwareUpdate(BTRPCProtocol * protocol);
  bool begin(const char * url, const char * cert, const char * checksum, bool insecure);
  void loop();
  void push();
};

// https://github.com/espressif/arduino-esp32/blob/master/libraries/Update/examples/AWS_S3_OTA_Update/AWS_S3_OTA_Update.ino
// TODO: use raw client
// https://randomnerdtutorials.com/esp32-https-requests/
FirmwareUpdate::FirmwareUpdate(BTRPCProtocol *protocol) {
  this->client = new WiFiClientSecure();
  this->protocol = protocol;
  this->http = new HTTPClient();

  this->state = UpdateState::Pending;
  this->progress = 0;

  Update.onProgress([this](size_t written, size_t total) {
    this->progress = (unsigned int)(written * 100 / total);
    Serial.printf("Progress: %u%%\n", this->progress);
    this->push();
  });
}

bool FirmwareUpdate::begin(const char * url, const char * cert, const char * checksum, bool insecure) {
  this->state = UpdateState::Downloading;
  this->push();

  Update.end();
  Serial.printf("Update set checksum: %s\n", checksum);
  Update.setMD5(checksum);

  if (insecure) {
    this->client->setInsecure();
  } else {
    this->client->setCACert(cert);
  }

  Serial.printf("Connect to url: %s\n", url);
  if (!this->http->begin(*this->client, url)) {
    Serial.println("Failed to connect.");
    this->state = UpdateState::Failure;
    this->push();
    return false;
  }

  Serial.print("[HTTPS] GET...\n");
  int httpCode = this->http->GET();
  if (httpCode == HTTP_CODE_OK) {
    int size = this->http->getSize();

    if (Update.begin(size)) {
      Serial.printf("Update started, size=%i http_code=%i\n", size, httpCode);

      return true;
    } else {
      Serial.printf("Invalid size: %i\n", size);
      this->state = UpdateState::Failure;
      this->push();
      this->http->end();

      return false;
    }
  } else {
    Serial.printf("[HTTPS] GET... failed, error: %s\n", this->http->errorToString(httpCode).c_str());
    this->http->end();
    this->state = UpdateState::Failure;
    this->push();

    return false;
  }

  return true;
}

void FirmwareUpdate::loop() {
  if (!this->http->connected()) {
    return;
  }

  auto size = this->client->available();
  if (size <= 0) {
    return;
  }

  if (size > 1024) { // read in 512 chunks, leaving this above would crash esp32 because of ram limitation
    size = 1024;
  }

  // TODO: set max size to 500 bytes?
  Serial.print('.');
  // Serial.printf("Reading update bytes: %i\n", size);
  uint8_t buffer[size];
  this->client->readBytes(buffer, size);

  if (Update.write(buffer, size) != size) {
    this->state = UpdateState::Failure;
    this->push();
    this->http->end();
    Update.end();
    return;
  }

  if (Update.isFinished()) {
    if (Update.end(true)) {
      Serial.println("OK. Update complete");
      this->state = UpdateState::Done;
    } else {
      this->state = UpdateState::Failure;
      Serial.println("Failed with update...");
      Update.printError(Serial);
    }

    this->http->end();
    this->push();
  }
}

void FirmwareUpdate::push() {
  DynamicJsonDocument doc(250);

  doc[F("ver")] = VERSION;
  doc[F("sta")] = this->state;
  doc[F("pro")] = this->progress;

  byte buffer[250];
  auto size = serializeMsgPack(doc, buffer);
  auto chara = this->protocol->firmware;
  auto value = chara->getValue();
  value.setValue(buffer, size);
  chara->setValue(value);
  chara->notify();
}

#endif
