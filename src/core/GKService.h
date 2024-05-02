#include <Arduino.h>
#include <ArduinoJson.h>
#include "BTRPCProtocol.h"

#ifndef GKService_H
#define GKService_H

class BTRPCProtocol;
class GunplaESPKit;

typedef std::function<void(BTRPCProtocol *proto, GunplaESPKit *gundam, uint32_t id, JsonObject &data)> GKServiceFunction;

class GKService {
  private:
    RPCCommand _command;
    GKServiceFunction _handleMethodFunction;
  public:
    GKService(RPCCommand command, GKServiceFunction handleMethodFunction);
    bool canHandle(RPCCommand command);
    void handle(BTRPCProtocol *proto, GunplaESPKit *gundam, uint32_t id, JsonVariant &json);
    ~GKService();
};

GKService::GKService(RPCCommand command, GKServiceFunction handleMethodFunction) {
  this->_command = command;
  this->_handleMethodFunction = handleMethodFunction;
}

bool GKService::canHandle(RPCCommand command) {
  return this->_command == command;
}

void GKService::handle(BTRPCProtocol *proto, GunplaESPKit *gundam, uint32_t id, JsonVariant &json) {
  JsonObject data = json.as<JsonObject>();
  _handleMethodFunction(proto, gundam, id, data);
}

GKService::~GKService() {
}

#endif
