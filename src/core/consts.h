#ifndef Consts_H
#define Consts_H

const char * MANUFACTURER               = "macbury";
const char * VERSION                    = "2024.2.19";
const char * GUNPLA_ACCESSORIES_CONFIG  = "/accessories.data";
const char * GUNPLA_BASE_CONFIG         = "/base.data";
const char * RECOVERY_FILE              = "/recovery.mode";
const int GUNPLA_CONFIG_SIZE            = 6048;
const int AID                           = 1000;
const int UPDATE_CHUNK                  = 100;
const int MAX_PINS                      = 12;
const int EFFECTS_ACCESSORY_AID         = 10000;
const int PING_TIMEOUT_MS               = 5 * 60 * 1000;
const int RESTART_INTERVAL              = 12 * 60 * 60 * 1000;// every 12 hours restart

#define PROTO_VERSION                   2
#define MIN_FRAME_SIZE                  5
#define CHUNK_SIZE                      200
#define TEMP_FILE                       "/msg.cache"
#define SERVICE_UUID                    "f085fb1e-935f-11ee-b9d1-0242ac120001" //- must match optional services on navigator.bluetooth.requestDevice
#define TX_CHARACTERISTIC_UUID          "f085fb1e-935f-11ee-b9d1-0242ac120002"
#define RX_CHARACTERISTIC_UUID          "f085fb1e-935f-11ee-b9d1-0242ac120003"
#define WIFI_CHARACTERISTIC_UUID        "f085fb1e-935f-11ee-b9d1-0242ac120004" // current state of wifi network
#define VERSION_CHARACTERISTIC_UUID     "f085fb1e-935f-11ee-b9d1-0242ac120005" // current version of firmware
#define STATE_CHARACTERISTIC_UUID       "f085fb1e-935f-11ee-b9d1-0242ac120006" // HOMESPAN STATE Characteristic
#define FIRMWARE_CHARACTERISTIC_UUID    "f085fb1e-935f-11ee-b9d1-0242ac120007" // write update bytes here
#endif
