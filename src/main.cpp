#include <Arduino.h>
#include <LittleFS.h>
#include <SPI.h>
#include <HomeSpan.h>
#include <TaskScheduler.h>
#include <time.h>

#include <core/BTRPCProtocol.h>
#include <core/GunplaESPKit.h>

#include <actions/read_base_config.h>
#include <actions/write_base_config.h>
#include <actions/list_wifi.h>
#include <actions/connect_wifi.h>
#include <actions/read_accessories_config.h>
#include <actions/write_accessories_config.h>
#include <actions/reboot.h>
#include <actions/system_info.h>
#include <actions/update_firmware.h>
#include <actions/ping.h>
#include <actions/all_states.h>
#include <actions/set_state.h>

const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 0;
const int daylightOffset_sec = 3600;

Scheduler ts;
BTRPCProtocol *protocol;
GunplaESPKit *gundam;

Task updateWiFiTask(10 * 1000, TASK_FOREVER, []() { gundam->broadcastWiFiStatus(); });

void setup() {
  Serial.begin(921600);
  Serial.println(F("[Booted]"));
  Serial.printf("LOG_LOCAL_LEVEL %d\n", LOG_LOCAL_LEVEL);

  //TODO: use ntp for simple automation?
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);

  homeSpan.setQRID("GESK");
  homeSpan.setLogLevel(1);
  homeSpan.setSerialInputDisable(true);
  homeSpan.setWifiCallback([]() { gundam->broadcastWiFiStatus(); });

  while (!LittleFS.begin(true, "/gunplakit")) {
    LittleFS.format();
    Serial.println(F("Failed to initialize LittleFS library"));
    delay(1000);
  }

  protocol = new BTRPCProtocol();
  gundam = new GunplaESPKit(protocol);

  gundam->checkRecoveryMode();
  gundam->enableRecoveryMode();

  if (gundam->load()) {
    if (gundam->isRecoveryMode()) {
      Serial.println("Recovery mode, skipping loading accessories");
    } else {
      gundam->reloadAccessories();
      Serial.println(F("Finished configuration"));
    }
  }

  gundam->disableRecoveryMode();

  protocol->configure(gundam->name, gundam->pin);
  homeSpan.setStatusCallback([](HS_STATUS status) { protocol->updateStatus(status); });

  gundam->on(RPCCommand::READ_CONFIG, handle_read_base_config);
  gundam->on(RPCCommand::WRITE_CONFIG, handle_write_base_config);
  gundam->on(RPCCommand::LIST_WIFI, handle_list_wifi);
  gundam->on(RPCCommand::SET_WIFI, handle_connect_wifi);
  gundam->on(RPCCommand::READ_ACCESSORIES, handle_read_accessories_config);
  gundam->on(RPCCommand::WRITE_ACCESSORIES, handle_write_accessories_config);
  gundam->on(RPCCommand::REBOOT, handle_reboot);
  gundam->on(RPCCommand::SYSTEM_INFO, handle_system_info);
  gundam->on(RPCCommand::UPDATE_FIRMWARE, update_firmware);
  gundam->on(RPCCommand::PING, handle_ping);
  gundam->on(RPCCommand::ALL_STATES, handle_all_states);
  gundam->on(RPCCommand::SET_STATE, handle_set_states);

  ts.addTask(updateWiFiTask);
  ts.enableAll();

  homeSpan.poll();
  gundam->act();
  gundam->firmwareUpdate->push();
}

void loop() {
  if (protocol->process()) {
    delay(1);
  }

  homeSpan.poll();
  ts.execute();
  gundam->act();
}
