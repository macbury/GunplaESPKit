#ifndef StartUpdate_H
#define StartUpdate_H

#include <core/BTRPCProtocol.h>
#include <core/GunplaESPKit.h>

const auto URL_KEY          = F("url");
const auto CERTIFICATE_KEY  = F("certificate");
const auto CHECKSUM_KEY     = F("checksum");
const auto INSECURE_KEY     = F("insecure");

void update_firmware(BTRPCProtocol *proto, GunplaESPKit *gundam, uint32_t id, JsonObject &data) {
  if (!data.containsKey(URL_KEY) || !data.containsKey(CERTIFICATE_KEY) || !data.containsKey(CHECKSUM_KEY)) {
    Serial.println(F("Missing checksum or certificate"));
    proto->reject(RPCResult::InvalidParams);
    return;
  }

  String url = data[URL_KEY];
  String certificate = data[CERTIFICATE_KEY];
  String checksum = data[CHECKSUM_KEY];

  bool insecure = data[INSECURE_KEY];

  if (gundam->firmwareUpdate->begin(url.c_str(), certificate.c_str(), checksum.c_str(), insecure)) {
    proto->ok();
  } else {
    proto->reject(RPCResult::InvalidParams);
  }

  proto->ok();
}

#endif
