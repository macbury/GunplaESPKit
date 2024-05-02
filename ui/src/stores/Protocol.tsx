import { decode, encode } from "@msgpack/msgpack";
import { action, computed, flow, makeAutoObservable, observable, toJS } from "mobx";
import FeatureFlagsStore from "./FeatureFlagsStore";
import { sleep } from "../utils/time";
import { IAccessories } from "./ManageAccessoriesStore";

const DEVICE_PREFIX                 = "GunplaESPKit";
const SERVICE_UID                   = "f085fb1e-935f-11ee-b9d1-0242ac120001";
const TX_CHARACTERISTIC_UUID        = "f085fb1e-935f-11ee-b9d1-0242ac120002";
const RX_CHARACTERISTIC_UUID        = "f085fb1e-935f-11ee-b9d1-0242ac120003";
const WIFI_CHARACTERISTIC_UUID      = "f085fb1e-935f-11ee-b9d1-0242ac120004";
const VERSION_CHARACTERISTIC_UUID   = "f085fb1e-935f-11ee-b9d1-0242ac120005";
const STATE_CHARACTERISTIC_UUID     = "f085fb1e-935f-11ee-b9d1-0242ac120006";
const FIRMWARE_CHARACTERISTIC_UUID  = "f085fb1e-935f-11ee-b9d1-0242ac120007";
const CHUNK_SIZE                    = 200;
const PROTO_VERSION                 = 2;
const RPC_TIMEOUT                   = 30*1000;

export enum RPCCommand {
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
  SET_STATE = 12
};

function rpcCommandToString(command: RPCCommand): string {
  switch (command) {
    case RPCCommand.NOP:
      return "NOP";
    case RPCCommand.READ_CONFIG:
      return "READ_CONFIG";
    case RPCCommand.WRITE_CONFIG:
      return "WRITE_CONFIG";
    case RPCCommand.LIST_WIFI:
      return "LIST_WIFI";
    case RPCCommand.SET_WIFI:
      return "SET_WIFI";
    case RPCCommand.READ_ACCESSORIES:
      return "READ_ACCESSORIES";
    case RPCCommand.WRITE_ACCESSORIES:
      return "WRITE_ACCESSORIES";
    case RPCCommand.REBOOT:
      return "REBOOT";
    case RPCCommand.SYSTEM_INFO:
      return "SYSTEM_INFO";
    case RPCCommand.UPDATE_FIRMWARE:
      return "UPDATE_FIRMWARE";
    case RPCCommand.PING:
      return "PING";
    case RPCCommand.ALL_STATES:
      return "ALL_STATES";
    case RPCCommand.SET_STATE:
      return "SET_STATE";
    default:
      return "Unknown";
  }
}

export enum RPCResult {
  Success = 0,
  InvalidVersion = 1,
  InvalidId = 2,
  InvalidMsgPack = 3,
  InvalidCRC = 4,
  NotImplemented = 6,
  NotFound = 7,
  InvalidParams = 8,
  Timeout = 9,
};

function rpcResultToString(result : RPCResult) : string {
  switch (result) {
    case RPCResult.Success:
      return "Success"
    case RPCResult.InvalidVersion:
      return "Invalid version"
    case RPCResult.InvalidCRC:
      return "Invalid crc code"
    case RPCResult.InvalidMsgPack:
      return "Invalid msg payload"
    case RPCResult.NotImplemented:
      return "Not implemented"
    case RPCResult.NotFound:
      return "Not Found"
    case RPCResult.InvalidParams:
      return "Invalid params"
    case RPCResult.InvalidId:
      return "Invalid id"
    case RPCResult.Timeout:
      return "Message timeout"
  }
}

type DeferedMessage = {
  command : RPCCommand,
  payload : any,
  resolve()
  reject()
}

export type SystemInfo = {
  bluetooth: {
    name: string,
    mac: string
  },
  esp: {
    md5: string,
    model: string,
    revision: string,
    board: string,
    variant: string
  }
}

class CommandResponseParser extends EventTarget {
  private buffer : Array<number>;

  constructor() {
    super()
    this.buffer = [];
  }

  public clean() {
    this.buffer = []
  }

  public consume(chunk: Uint8Array) {
    let cursor = 0;

    const version = chunk[cursor++];
    const id = chunk[cursor++];
    const status = chunk[cursor++];
    const chunkId = chunk[cursor++];
    const chunkCount = chunk[cursor++];

    const payload = chunk.slice(cursor, chunk.length - 1);
    this.buffer = [...this.buffer, ...payload];
    const crc = chunk[chunk.length-1];

    // console.debug('part', {
    //   version, id, status, chunkId, chunkCount, payload, crc, chunk
    // });

    if (chunkId == chunkCount) {
      if (status === RPCResult.Success) {
        const data = decode(this.buffer);
        console.log('Got data: ', data);
        this.dispatchEvent(new CustomEvent("command", { detail: data }));
      } else {
        console.error('failure', rpcResultToString(status))
        this.dispatchEvent(new CustomEvent("failure", { detail: status }));
      }

      this.buffer = []
    }
  }
}

export type WiFiState = {
  connected: boolean,
  ip: string,
  mac: string,
  rssi: number,
  ssid: string,
  hostname: string,
  uptime: number
}

export type OKResponse = { ok: boolean }

export type Network = {
  id: number,
  SSID: string,
  RSSI: number
}

export type GunplaConfig = {
  name: string,
  pin: number,
  pairingCode: string
}

export type IState = {
  id: number,
  sta: boolean,
  b?: number,

  h?: number,
  s?: number,
  v?: number
}

export type AllStates = {
  accessories: IState[]
}

export type FirmwareUpdateState = {
  sta: FirmwareUpdate,
  pro: number
  ver: string
}

export enum FirmwareUpdate {
  Pending = 0,
  Downloading = 1,
  Done = 2,
  Failure = 3
}

class RPCCommands {
  private protocol: GunplaProtocol;

  constructor(protocol : GunplaProtocol) {
    this.protocol = protocol;
  }

  public async updateFirmware(checksum : string, certificate : string, url : string, insecure : boolean) : Promise<OKResponse> {
    return this.protocol.call(RPCCommand.UPDATE_FIRMWARE, { checksum, certificate, url, insecure });
  }

  public async getAllStates() : Promise<AllStates> {
    return this.protocol.call(RPCCommand.ALL_STATES);
  }

  public async setState(config : { id: number, sta: boolean, b?: number }) : Promise<OKResponse> {
    return this.protocol.call(RPCCommand.SET_STATE, config);
  }

  public async readSystemInfo() : Promise<SystemInfo> {
    return this.protocol.call(RPCCommand.SYSTEM_INFO);
  }

  public async readConfig() : Promise<GunplaConfig> {
    return this.protocol.call(RPCCommand.READ_CONFIG);
  }

  public ping() {
    this.protocol.sendWithoutResponse(RPCCommand.PING);
  }

  public async readAccessories() : Promise<IAccessories> {
    return this.protocol.call(RPCCommand.READ_ACCESSORIES);
  }

  public async check() : Promise<OKResponse> {
    return this.protocol.call(RPCCommand.PING);
  }

  public async connectWiFi(config : { SSID: string, password: string }) : Promise<OKResponse> {
    return this.protocol.call(RPCCommand.SET_WIFI, config);
  }

  public async listWifi() : Promise<{ networks: Network[] }> {
    return this.protocol.call(RPCCommand.LIST_WIFI);
  }

  public async reboot() : Promise<OKResponse> {
    return this.protocol.call(RPCCommand.REBOOT);
  }

  public async writeConfig(config : GunplaConfig) {
    return new Promise((resolve, reject) => {
      const device = this.protocol.device
      device.addEventListener('gattserverdisconnected', () => {
        setTimeout(resolve, 1000);
      })
      setTimeout(() => {
        device.removeEventListener('gattserverdisconnected', resolve)
        resolve(false)
      }, 10000)
      this.protocol.call(RPCCommand.WRITE_CONFIG, config).catch(reject)
    })
  }
}

export default class GunplaProtocol {
  public wifi: BluetoothRemoteGATTCharacteristic;
  public tx: BluetoothRemoteGATTCharacteristic;
  public rx: BluetoothRemoteGATTCharacteristic;
  public parser: CommandResponseParser;
  public device: BluetoothDevice
  public server: BluetoothRemoteGATTServer
  public state: BluetoothRemoteGATTCharacteristic
  public network: WiFiState
  public rpc: RPCCommands;
  private lock: boolean
  private version: BluetoothRemoteGATTCharacteristic;
  private messages: DeferedMessage[]
  private wakeLock: WakeLockSentinel
  public currentVersion: string;
  private features: FeatureFlagsStore;
  public firmware: BluetoothRemoteGATTCharacteristic;
  public firmwareUpdate: FirmwareUpdateState;

  constructor(features: FeatureFlagsStore) {
    this.features = features;
    this.parser = new CommandResponseParser();
    this.rpc = new RPCCommands(this);
    this.messages = []
    this.lock = false;

    makeAutoObservable(this, {
      // start: flow.bound,
      connected: computed,
      wifi: observable.ref,
      tx: observable.ref,
      rx: observable.ref,
      parser: observable.ref,
      device: observable.ref,
      openDevice: flow.bound,
      reconnect: flow.bound,
      cleanup: action.bound,
      nextMessage: action.bound
    });

    this.nextMessage()
  }

  public async nextMessage() {
    if (this.messages.length == 0) {
      setTimeout(this.nextMessage, 1);
      return
    }

    if (this.lock) {
      console.log("Already waiting for one message");
      setTimeout(this.nextMessage, 100);
      return;
    }

    this.lock = true;
    const message = this.messages.shift();
    const { command, payload } = message
    console.log("Call", { command: rpcCommandToString(command), payload: toJS(payload) })
    const reject = message.reject as any
    const resolve = message.resolve as any

    const finish = () => {
      this.lock = false;
      setTimeout(this.nextMessage, 1);
    }

    this.parser.addEventListener('command', (ev : any) => {
      setTimeout(() => {
        resolve(ev.detail)
        finish()
      }, 1);
    }, { once: true })
    this.parser.addEventListener('failure', (e) => {
      reject(e);
      finish()
    }, { once: true })
    const timeoutHandler = setTimeout(() => {
      reject(RPCResult.Timeout)
      finish()
    }, RPC_TIMEOUT)

    try {
      await this.send(command, payload)
    } catch (e) {
      reject(e)
      finish()
    } finally {
      clearTimeout(timeoutHandler)
    }
  }

  public get connected() {
    return this.server?.connected
  }

  public restart() {
    this.server?.disconnect()
    this.server = null
    this.tx = this.rx = this.wifi = null
    this.parser.clean()
    this.messages = []
    this.lock = false
  }

  public cleanup() {
    console.log("Cleanup protocol!");
    this.restart()
    this.parser.clean()
    this.wakeLock?.release()
    this.server?.disconnect()
    this.wifi = null
    this.server = null
    this.tx = this.rx = this.wifi = null
    this.device = null
    this.network = {
      connected: false,
      hostname: '',
      ip: '',
      mac: '',
      rssi: 0,
      ssid: '',
      uptime: 0
    }
    this.messages = []
  }

  public *openDevice(name = null) {
    if (!this.device) {
      console.log("Requesting new device...");
      try {
        this.device = yield navigator.bluetooth.requestDevice({
          filters: [{ namePrefix: name || DEVICE_PREFIX }],
          optionalServices: [SERVICE_UID]
        });

        // this.device.addEventListener('gattserverdisconnected', this.cleanup)

        return true;
      } catch (e) {
        if (e.name == "NotFoundError") {
          return false
        } else {
          throw e
        }
      }


      // // yield this.device.watchAdvertisements()
      // this.device.addEventListener('advertisementreceived', (e) => {
      //   console.log('advertisementreceived', e);
      // })

      // this.device.addEventListener('gattserverdisconnected', () => {
      //   console.log('Disconnected, reconnect in 5 seconds')
      //   // setTimeout(() => this.reconnect(), 5000) // TODO: move to react component, show window reconnecting etc
      // });
    } else {
      console.log("Reusing device");
      return true;
    }
  }

  public *check(retriesLeft = 5) {
    try {
      yield this.rpc.check()
    } catch (e) {
      console.error('Failed to check...', e);
      retriesLeft--;
      if (retriesLeft > 0) {
        yield sleep(1000)
        yield this.check(retriesLeft)
      } else {
        throw e
      }
    }
  }

  public get name() {
    return this.device?.name || '...'
  }

  public *reconnect(retriesLeft = 5) {
    this.parser.clean();

    try {
      if (this.device == null) {
        return false;
      }

      if (this.wakeLock == null) {
        this.wakeLock = yield navigator.wakeLock.request("screen");
      }

      if (this.server == null) {
        console.log("Connecting to new server");
        this.server = yield this.device.gatt.connect();
        console.log("Done.")
      } else if (!this.server.connected) {
        console.log("Reusing old server");
        yield this.server.connect();
      }

      console.log("Waiting one seocond")
      yield sleep(1000);
      console.log("Fetching services")
      const service = yield this.server.getPrimaryService(SERVICE_UID);
      // TODO: fix this? this looks like shit
      this.version = yield service.getCharacteristic(VERSION_CHARACTERISTIC_UUID);
      const v: DataView = yield this.version.readValue();
      this.currentVersion = (new TextDecoder()).decode(v)
      this.features.setCurrentVersion(this.currentVersion)
      this.state = yield service.getCharacteristic(STATE_CHARACTERISTIC_UUID);
      this.state.startNotifications()

      this.wifi = yield service.getCharacteristic(WIFI_CHARACTERISTIC_UUID);
      this.handleWifiNotification(yield this.wifi.readValue());

      this.wifi.startNotifications();
      this.wifi.addEventListener('characteristicvaluechanged', (e : any) => {
        this.handleWifiNotification(e.target.value);
      });

      this.firmware = yield service.getCharacteristic(FIRMWARE_CHARACTERISTIC_UUID);
      yield this.firmware.startNotifications();

      this.firmware.addEventListener('characteristicvaluechanged', (e : any) => {
        this.handleFirmwareUpdate(e.target.value);
      });
      this.handleFirmwareUpdate(yield this.firmware.readValue());

      this.tx = yield service.getCharacteristic(TX_CHARACTERISTIC_UUID);
      yield this.tx.startNotifications();

      this.tx.addEventListener('characteristicvaluechanged', (e : any) => {
        this.parser.consume(new Uint8Array( e.target.value.buffer));
      });

      this.rx = yield service.getCharacteristic(RX_CHARACTERISTIC_UUID);
    } catch (e) {
      console.error('Failed to reconnect...', e);
      retriesLeft--;

      if (retriesLeft > 0) {
        yield sleep(2500)
        yield this.reconnect(retriesLeft)
      } else {
        throw e
      }
    }

    return true;
  }

  private async send(command : RPCCommand, payload : any) : Promise<number> {
    const data = encode(payload);
    const chunks = [];
    const id = new Date().getTime() % 255;
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      chunks.push(data.slice(i, i + CHUNK_SIZE));
    }

    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex];
      const payload = new Uint8Array([
        PROTO_VERSION,
        id,
        command,
        chunkIndex + 1,
        chunks.length,
        ...chunk,
        0
      ]);

      const crc = payload.reduce((sum, cur) => sum + cur, 0);
      payload[payload.length - 1] = crc % 255;

      await this.rx?.writeValue(payload);
    }

    return id
  }

  public sendWithoutResponse(command : RPCCommand, payload : any = {}) {
    this.messages.push({ command, payload, resolve: () => null, reject: () => null })
  }

  public call(command : RPCCommand, payload : any = {}) : Promise<any> {
    return new Promise((resolve : any, reject : any) => {
      this.messages.push({ command, payload, resolve, reject })
    })
  }

  private handleFirmwareUpdate(dv : DataView | undefined) {
    if (!dv) {
      return;
    }

    const data = new Uint8Array(dv.buffer);
    try {
      const payload = decode(data);
      this.firmwareUpdate = payload as FirmwareUpdate
      console.log("Current firmware", payload)
    } catch (e) {
      console.error("Failed to firmware status", e, data)
    }
  }

  private handleWifiNotification(dv : DataView | undefined) {
    if (!dv) {
      return;
    }

    const data = new Uint8Array(dv.buffer);
    try {
      const payload = decode(data);
      this.network = payload
      console.log("Current network", payload)
    } catch (e) {
      console.error("Failed to fetch wifi", e, data)
    }
  }
}
