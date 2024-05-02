#ifndef BTRPCProtocol_H
#define BTRPCProtocol_H

#include <Arduino.h>
#include <LittleFS.h>
#include <NimBLEDevice.h>
#include <ArduinoJson.h>
#include <HomeSpan.h>
#include <esp_bt.h>

#include "consts.h"

enum RPCCommand {
  NOP = 0,
  READ_CONFIG = 1,
  WRITE_CONFIG = 2,
  LIST_WIFI = 3,
  SET_WIFI = 4,
  READ_ACCESSORIES = 5,
  WRITE_ACCESSORIES = 6,
  REBOOT = 7,
  SYSTEM_INFO = 8,
  UPDATE_FIRMWARE = 9,
  PING = 10,
  ALL_STATES = 11,
  SET_STATE = 12,
};

enum RPCResult {
  Success = 0,
  InvalidVersion = 1,
  InvalidId = 2,
  InvalidMsgPack = 3,
  InvalidCRC = 4,
  NotImplemented = 6,
  NotFound = 7,
  InvalidParams = 8,
  Timeout = 9,
  FirmwareUpdateFailure = 10,
  InvalidSignature = 11
};

typedef std::function<void(uint8_t id, RPCCommand command, JsonVariant &json)> RPCCommandReceived;

struct ResponseProtocolWriter {
  BLECharacteristic *tx;
  uint8_t id;
  size_t size;
  uint32_t crc;
  uint32_t cursor;
  uint32_t totalWritten;
  uint32_t chunk;
  uint8_t chunksCount;
  uint8_t buffer[512];

  ResponseProtocolWriter(BLECharacteristic *tx, uint8_t id, size_t size) {
    this->tx = tx;
    this->id = id;
    this->size = size;
    this->crc = 0;
    this->cursor = 0;
    this->chunk = 0;
    this->chunksCount = ceil((float)this->size / (float)CHUNK_SIZE);// returns 0 for smaller size...
    this->header();
  }

  void header() {
    for (size_t i = 0; i < 512; i++) {
      this->buffer[i] = 0;
    }

    this->crc = 0;
    this->cursor = 0;
    this->buffer[this->cursor++] = PROTO_VERSION;
    this->buffer[this->cursor++] = this->id;
    this->buffer[this->cursor++] = RPCResult::Success;
    this->buffer[this->cursor++] = this->chunk + 1;
    this->buffer[this->cursor++] = this->chunksCount;

    //https://github.com/bblanchon/ArduinoJson/blob/498a2e4c1e5294468071bc4814940ef939284a9e/extras/tests/JsonSerializer/CustomWriter.cpp
  }

  void close() {
    if (this->cursor > 4) {// if we have some bytes in chunk push them, first 4 bytes is just header
      this->push();
    }
  }

  void push() {
    this->buffer[this->cursor++] = this->crc % 255;
    // Serial.print("Push====");
    // Serial.println(this->cursor);
    // for (size_t i = 0; i < this->cursor; i++) {
    //   Serial.print(this->buffer[i]);
    //   Serial.print(' ');
    // }

    // Serial.println("\nPush====");
    auto value = this->tx->getValue();
    value.setValue(this->buffer, this->cursor);
    this->tx->setValue(value);
    this->tx->notify();
    this->chunk++;
    this->header();
  }

  size_t write(uint8_t c) {
    this->crc += c;
    // Serial.printf("Write: %i\n Cursor: %i", c, this->cursor);
    this->buffer[this->cursor++] = c;
    if (this->cursor >= CHUNK_SIZE - 1) {
      this->push();
    }
    return 1;
  }

  size_t write(const uint8_t *s, size_t n) {
    for (size_t i = 0; i < n; i++){
      this->write(s[i]);
    }

    return n;
  }
};

class BTRPCProtocol : public NimBLEServerCallbacks, public NimBLECharacteristicCallbacks {
private:
  RPCCommandReceived _onRPCCommandReceived;
  BLEServer * server;
  BLEService * service;

  BLECharacteristic *tx;
  BLECharacteristic *rx;
  BLECharacteristic *wifi;
  BLECharacteristic *version;

  /// current command id
  uint8_t id;
  int pin; // bluetooth pin code
  RPCCommand rpcCommand;
  bool msgReady;
  unsigned long lastPing;
public:
  BLECharacteristic *firmware;
  char deviceName[32];
  BLECharacteristic *state;

  BTRPCProtocol();
  void onRPCCommand(RPCCommandReceived callback);
  virtual void onConnect(NimBLEServer* pServer, ble_gap_conn_desc* desc);
  virtual void onDisconnect(BLEServer* pServer);
  virtual void onWrite(BLECharacteristic *pCharacteristic);
  virtual void onMTUChange(uint16_t MTU, ble_gap_conn_desc* desc);
  virtual void onAuthenticationComplete(ble_gap_conn_desc* desc);
  virtual uint32_t onPassKeyRequest();
  ResponseProtocolWriter* begin(size_t size);
  void configure(const char * name, int pin);
  void setWiFiStatus(bool connected, const char * ssid, int rssi, const char * mac, const char * ip, const char * hostname);
  void accept(DynamicJsonDocument &doc);
  void ok();
  void reject(RPCResult result);
  void updateStatus(HS_STATUS status);
  bool process();
  void cleanup();
  bool connected();
  void disconnect();
  void ping();
  ~BTRPCProtocol();
};

BTRPCProtocol::BTRPCProtocol() {
  this->cleanup();
}

bool BTRPCProtocol::connected() {
  return this->server->getConnectedCount() > 0;
}

void BTRPCProtocol::configure(const char * name, int pin) {
  this->pin = pin;

  snprintf(deviceName, sizeof(deviceName), "GunplaESPKit: %s", name);
  NimBLEDevice::init(deviceName);
  NimBLEDevice::setDeviceName(deviceName);
  NimBLEDevice::setSecurityAuth(true, true, true);
  NimBLEDevice::setPower(ESP_PWR_LVL_P9);
  NimBLEDevice::setSecurityIOCap(BLE_HS_IO_DISPLAY_ONLY);
  NimBLEDevice::setSecurityAuth(BLE_SM_PAIR_AUTHREQ_BOND);
  // https://github.com/h2zero/NimBLE-Arduino/blob/release/1.4/examples/NimBLE_Server/NimBLE_Server.ino#L175C5-L175C117
  // BLEDevice::setEncryptionLevel(ESP_BLE_SEC_ENCRYPT_MITM);

  Serial.printf("[GunplaESPKit] Device: %s with name %s pin: %i\n", BLEDevice::toString().c_str(), deviceName, this->pin); //todo: print name

  this->server = BLEDevice::createServer();
  this->server->setCallbacks(this);
  this->server->advertiseOnDisconnect(true);
  this->service = this->server->createService(SERVICE_UUID);

  Serial.printf("Created BT Service: %s\n", SERVICE_UUID);

  this->tx = this->service->createCharacteristic(TX_CHARACTERISTIC_UUID, NIMBLE_PROPERTY::NOTIFY);
  this->tx->setValue("");

  Serial.printf("Created TX: %s\n", TX_CHARACTERISTIC_UUID);

  this->rx = this->service->createCharacteristic(RX_CHARACTERISTIC_UUID, NIMBLE_PROPERTY::WRITE | NIMBLE_PROPERTY::WRITE_ENC | NIMBLE_PROPERTY::WRITE_AUTHEN);
  this->rx->setValue("");
  this->rx->setCallbacks(this);

  Serial.printf("Created RX: %s\n", RX_CHARACTERISTIC_UUID);

  this->wifi = this->service->createCharacteristic(WIFI_CHARACTERISTIC_UUID, NIMBLE_PROPERTY::NOTIFY | NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::READ_ENC | NIMBLE_PROPERTY::READ_AUTHEN);
  Serial.printf("Created wifi: %s\n", WIFI_CHARACTERISTIC_UUID);

  this->version = this->service->createCharacteristic(VERSION_CHARACTERISTIC_UUID, NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::READ_ENC | NIMBLE_PROPERTY::READ_AUTHEN);
  this->version->setValue(String(VERSION));
  Serial.printf("Created VERSION: %s\n", VERSION_CHARACTERISTIC_UUID);

  this->state = this->service->createCharacteristic(STATE_CHARACTERISTIC_UUID, NIMBLE_PROPERTY::NOTIFY | NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::READ_ENC | NIMBLE_PROPERTY::READ_AUTHEN);
  this->state->setValue(HS_STATUS::HS_REBOOTING);
  Serial.printf("Created state: %s\n", STATE_CHARACTERISTIC_UUID);

  this->firmware = this->service->createCharacteristic(FIRMWARE_CHARACTERISTIC_UUID, NIMBLE_PROPERTY::NOTIFY | NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::READ_ENC | NIMBLE_PROPERTY::READ_AUTHEN);
  Serial.printf("Created firmware: %s\n", FIRMWARE_CHARACTERISTIC_UUID);

  this->service->start();

  BLEAdvertising *pAdvertising = this->server->getAdvertising();
  pAdvertising->addServiceUUID(this->service->getUUID());
  pAdvertising->setScanResponse(true);
  pAdvertising->start(0);
}

void BTRPCProtocol::onRPCCommand(RPCCommandReceived callback) {
  this->_onRPCCommandReceived = callback;
}

void BTRPCProtocol::updateStatus(HS_STATUS status) {
  this->state->setValue(status);
  this->state->notify();
}

void BTRPCProtocol::cleanup() {
  this->id = 0;
  this->msgReady = false;
  this->rpcCommand = RPCCommand::NOP;
  this->ping();

  if (LittleFS.remove(TEMP_FILE)) {
    Serial.printf("Removed message cache: %s\n", TEMP_FILE);
  } else {
    Serial.printf("No message cache: %s\n", TEMP_FILE);
  }
}

void BTRPCProtocol::ping() {
  this->lastPing = millis();
}

void BTRPCProtocol::setWiFiStatus(bool connected, const char * ssid, int rssi, const char * mac, const char * ip, const char * hostname) {
  DynamicJsonDocument doc(250);

  doc[F("connected")] = connected;
  doc[F("ssid")] = ssid;
  doc[F("mac")] = mac;

  doc[F("uptime")] = millis();

  if (connected) {
    doc[F("hostname")] = hostname;
    doc[F("rssi")] = rssi;
    doc[F("ip")] = ip;
  }

  byte buffer[250];
  auto size = serializeMsgPack(doc, buffer);
  auto value = this->wifi->getValue();
  value.setValue(buffer, size);
  this->wifi->setValue(value);
  this->wifi->notify();
}

void BTRPCProtocol::onConnect(NimBLEServer* pServer, ble_gap_conn_desc *desc) {
  Serial.print("Client address: ");
  Serial.println(NimBLEAddress(desc->peer_ota_addr).toString().c_str());
  this->cleanup();
  this->ping();
}

void BTRPCProtocol::onMTUChange(uint16_t MTU, ble_gap_conn_desc* desc) {
  Serial.printf("MTU updated: %u for connection ID: %u\n", MTU, desc->conn_handle);
}

uint32_t BTRPCProtocol::onPassKeyRequest() {
  Serial.printf("Server Passkey Request: %i\n", this->pin);
  return this->pin;
}

void BTRPCProtocol::disconnect() {
  Serial.println("Disconnect devices...");
  auto devices = this->server->getPeerDevices();
  for (size_t i = 0; i < devices.size(); i++) {
    auto deviceId = devices[i];
    this->server->disconnect(deviceId);
  }
}

void BTRPCProtocol::onAuthenticationComplete(ble_gap_conn_desc* desc){
  if(!desc->sec_state.encrypted) {
    NimBLEDevice::getServer()->disconnect(desc->conn_handle);
    Serial.println("Encrypt connection failed - disconnecting client");
    return;
  }
  Serial.println("Starting BLE work!");
}

void BTRPCProtocol::onDisconnect(BLEServer* _pServer) {
  Serial.println("Bluetooth client disconnected, starting advertising again");
  this->cleanup();
  auto advertising = this->server->getAdvertising();
  advertising->setScanResponse(true);
  advertising->setName(this->deviceName);
  // advertising->setURI();
  advertising->start(0);
}

void BTRPCProtocol::onWrite(BLECharacteristic *pCharacteristic) {
  std::string value = pCharacteristic->getValue();
  uint8_t *rxData = (uint8_t*)value.data();
  auto length = pCharacteristic->getValue().length();

  if (length < MIN_FRAME_SIZE) {
    Serial.printf("Ignoring invalid small data package: %i which is below %i\n", length, MIN_FRAME_SIZE);
    return;
  } else {
    Serial.printf("RX got data length: %i and size: %i\n", length, pCharacteristic->getDataLength());
  }

  size_t i = 0;
  uint8_t version = rxData[i++];
  uint8_t oldId = this->id;
  this->id = rxData[i++];

  if (version != PROTO_VERSION) {
    Serial.printf("Invalid protocol version: %i\n", version);
    this->reject(RPCResult::InvalidVersion);
    return;
  }

  bool newMessage = !LittleFS.exists(TEMP_FILE);
  if (!newMessage && this->id != oldId) {
    // Serial.printf(": %i\n", version);
    this->reject(RPCResult::InvalidId);
    return;
  }

  // TODO: check if id match the same current id, if new message store id
  this->rpcCommand = static_cast<RPCCommand>(rxData[i++]);

  uint8_t chunkIndex = rxData[i++];
  uint8_t chunkCount = rxData[i++];

  uint32_t calculated_crc = 0;
  for (size_t a = 0; a < length - 1; a++) {
    calculated_crc += rxData[a];
  }

  auto mode = newMessage ? FILE_WRITE : FILE_APPEND;
  if (newMessage) {
    Serial.println("Continuing message...");
  }

  File temp = LittleFS.open(TEMP_FILE, mode, true);

  while (i < length - 1) {
    uint8_t data = rxData[i++];
    // Serial.print(data);
    temp.write(data);
  }

  temp.flush();
  Serial.printf("File size: %i, written: %i\n", temp.size(), length);
  temp.close();

  uint8_t naive_crc = calculated_crc % 255;
  uint8_t crc = rxData[i++];
  Serial.printf("Version %i, Command: %i, Chunk %i/%i, CRC: %i == %i\n", version, rpcCommand, chunkIndex, chunkCount, crc, naive_crc);
;

  if (naive_crc != crc) {
    Serial.println(F("Invalid CRC"));
    this->reject(RPCResult::InvalidCRC);
    this->cleanup();
    return;
  }

  if (chunkIndex == chunkCount) {
    Serial.println(F("Message ready to be processed"));
    msgReady = true;
  }
}

bool BTRPCProtocol::process() {
  if (millis() - this->lastPing > PING_TIMEOUT_MS && this->connected()) {
    this->disconnect();
    this->cleanup();
    return true;
  }

  // The processing of messages is done in a separate loop to avoid potential kernel panics caused by long processing times.
  if (!msgReady) {
    return true;
  }

  Serial.println(F("Processing new message"));
  File file = LittleFS.open(TEMP_FILE, FILE_READ, false);
  Serial.printf("Got request, Free heap memory: %u bytes\n", ESP.getFreeHeap());
  DynamicJsonDocument doc(6048);

  DeserializationError error = deserializeMsgPack(doc, file);
  file.close();

  if (error) {
    Serial.printf("Problem with message: %s\n", error.c_str());
    this->reject(RPCResult::InvalidMsgPack);
    this->cleanup();
    return false;
  }

  if (this->_onRPCCommandReceived) {
    JsonVariant json = doc.as<JsonVariant>();
    this->_onRPCCommandReceived(id, rpcCommand, json);
  }

  Serial.printf("Finished request, Free heap memory: %u bytes\n", ESP.getFreeHeap());
  // Serial.println("============ Message: ");
  // serializeJsonPretty(doc, Serial);
  // Serial.println("============ End");

  // this->accept(doc);
  this->cleanup();
  return false;
}

void BTRPCProtocol::reject(RPCResult result) {
  uint8_t buffer[5];
  buffer[0] = PROTO_VERSION;
  buffer[1] = this->id;
  buffer[2] = result;
  buffer[3] = 1;// chunk index is 1
  buffer[4] = 1;// chunk number is 1

  this->tx->setValue(buffer);
  this->tx->notify();
  this->cleanup();
}

void BTRPCProtocol::accept(DynamicJsonDocument &doc) {
  Serial.print("Accepted: ");
  serializeJson(doc, Serial);
  Serial.println();
  auto size = measureMsgPack(doc);
  auto writer = ResponseProtocolWriter(this->tx, this->id, size);
  serializeMsgPack(doc, writer);
  writer.close();
  this->cleanup();
}

void BTRPCProtocol::ok() {
  DynamicJsonDocument doc(100);
  doc["ok"] = true;
  this->accept(doc);
}

ResponseProtocolWriter* BTRPCProtocol::begin(size_t size) {
  return new ResponseProtocolWriter(this->tx, this->id, size);
}

BTRPCProtocol::~BTRPCProtocol() {
}

#endif
