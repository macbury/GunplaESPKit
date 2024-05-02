import { action, makeAutoObservable } from "mobx"
import GunplaProtocol from "./Protocol"
import { ManageDeviceStore } from "./ManageDeviceStore"
import { InstallFirmwareStore } from "./FirmwareStore"
import { NetworkStore } from "./NetworkStore"
import FeatureFlagsStore from "./FeatureFlagsStore"
import { OTAStore } from "./OTAStore"
import { PreviewStore } from "./PreviewStore"
import { ManageAccessoriesStore } from "./ManageAccessoriesStore"

export enum Screen {
  Start,
  ConnectToBluetoothDevice,
  BluetoothDashboard,
  FirstDeviceSetup,
  InstallFirmware,
  OTAUpdate
}

export class AppStore {
  public currentScreen : Screen = Screen.Start
  public protocol : GunplaProtocol
  public manageDevice : ManageDeviceStore
  public firmware : InstallFirmwareStore
  public network : NetworkStore
  public features: FeatureFlagsStore
  public ota : OTAStore
  public preview : PreviewStore
  public accessories : ManageAccessoriesStore

  constructor() {
    this.features = new FeatureFlagsStore();
    this.protocol = new GunplaProtocol(this.features);
    this.manageDevice = new ManageDeviceStore(this);
    this.firmware = new InstallFirmwareStore();
    this.network = new NetworkStore(this.protocol)
    this.accessories = new ManageAccessoriesStore(this.protocol);
    this.ota = new OTAStore(this.protocol, this.manageDevice)
    this.preview = new PreviewStore(this.protocol, this.features, this.accessories)

    makeAutoObservable(this, {
      cleanup: action.bound
    })
  }
  public changeScreen(nextScreen : Screen) {
    this.currentScreen = nextScreen
  }

  public cleanup() {
    this.accessories.cleanup()
    this.protocol.cleanup()
    this.firmware.cleanup()
  }
}
