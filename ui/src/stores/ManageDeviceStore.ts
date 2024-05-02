import { computed, flow, makeAutoObservable } from "mobx";
import { AppStore } from "./AppStore";
import GunplaProtocol, { SystemInfo } from "./Protocol"
import { CATEGORIES, createSetupUri } from "../utils/homekit";
import { redactMac } from "../utils/md5";


export type GunplaConfig = {
  name: string,
  pin: number,
  pairingCode: string
}

export class ManageDeviceStore {
  private protocol: GunplaProtocol;
  public config: GunplaConfig
  public systemInfo: SystemInfo

  constructor(app : AppStore) {
    this.protocol = app.protocol;

    makeAutoObservable(this, {
      loadConfig: flow.bound,
      homekitUri: computed
    });
  }

  /// Gene
  public get redactedMac() {
    return redactMac(this.systemInfo.bluetooth.mac)
  }

  public get pairingCode() {
    if (this.config) {
      const code = this.config.pairingCode;
      return `${code[0]}${code[1]}${code[2]}-${code[3]}${code[4]}-${code[5]}${code[6]}${code[7]}`
    } else {
      return '...'
    }
  }

  public *updateBluetoothPin(pin : number) {
    yield this.loadConfig()
    this.config.pin = pin
    this.protocol.rpc.writeConfig(this.config)
  }

  public *loadSystemInfo() {
    this.systemInfo = yield this.protocol.rpc.readSystemInfo()
  }

  public *loadConfig() {
    try {
      this.config = yield this.protocol.rpc.readConfig();
      // if config is null
    } catch (e) {
      console.error('failed to load config', e)
      return false;
    }

    return true;
  }

  public get homekitUri() {
    return createSetupUri(
      CATEGORIES.get('bridge'),
      this.config.pairingCode,
      'GESK'
    )
  }

}
