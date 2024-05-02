import { action, autorun, computed, flow, makeAutoObservable, runInAction, toJS } from "mobx";
import GunplaProtocol, { FirmwareUpdate } from "./Protocol";
import { builds, RootCert } from "../firmware"
import { parseSemanticVersion } from "./FeatureFlagsStore";
import { ManageDeviceStore } from "./ManageDeviceStore";
import { convertMillisecondsToTime } from "../utils/time";

export class OTAStore {
  private protocol: GunplaProtocol;
  private manageDevice: ManageDeviceStore;

  public progress: number
  public startTime: Date
  public opened: boolean
  public insecure: boolean
  public state: FirmwareUpdate
  public currentFirmwareVersion: number
  public chip: string;
  public model: string;

  constructor(proto : GunplaProtocol, manageDevice : ManageDeviceStore) {
    this.protocol = proto
    this.manageDevice = manageDevice;
    this.startTime = new Date()
    this.opened = false
    this.state = FirmwareUpdate.Pending

    makeAutoObservable(this, {
      start: flow.bound,
      eta: computed,
      setInsecure: action.bound
    })

    autorun(() => {
      const fu = this.protocol.firmwareUpdate
      const si = this.manageDevice.systemInfo
      console.log('systemInfo', toJS(si))
      console.log('firmwareUpdate', toJS(fu))

      runInAction(() => {
        this.progress = fu?.pro / 100.0
        this.state = fu?.sta || FirmwareUpdate.Pending
        this.chip = si?.esp?.variant?.toUpperCase()
        this.model = si?.esp?.model?.toUpperCase()
        this.currentFirmwareVersion = parseSemanticVersion(fu?.ver || "0.0.0")
      })
    });
  }

  public get currentBuildVersion() {
    if (this.currentBuild) {
      return parseSemanticVersion(this.currentBuild.version);
    } else {
      return 0
    }
  }

  public get futureVersion() {
    return this.currentBuild?.version || 'unknown'
  }

  public get isUpdateAvailable() {
    return this.currentBuildVersion > this.currentFirmwareVersion
  }

  public get currentBuild() {
    return builds.find(({ chipFamily }) => chipFamily == this.chip || chipFamily == this.model)
  }

  public setInsecure(insecure : boolean) {
    this.insecure = insecure
  }

  public get isRunning() {
    return this.state == FirmwareUpdate.Downloading
  }

  public get isPending() {
    return this.state == FirmwareUpdate.Pending
  }

  public get isError() {
    return this.state == FirmwareUpdate.Failure
  }

  public get eta(): string {
    const remainingProgress = 1.0 - this.progress;
    const currentTime = new Date().getTime();
    const elapsedTime = currentTime - this.startTime;
    const estimatedTime = (elapsedTime / this.progress) * remainingProgress;
    // const eta = new Date(currentTime + estimatedTime);
    console.log('estimatedTime', estimatedTime)
    if (isNaN(estimatedTime) || estimatedTime == null || estimatedTime == Infinity) {
      return 'Please Wait...'
    }
    return convertMillisecondsToTime(estimatedTime);
  }

  public *start() {
    this.opened = true
    this.state = FirmwareUpdate.Downloading
    this.startTime = new Date()
    this.progress = 0.0

    const url = new URL(window.location.href);
    url.pathname = this.currentBuild.firmware
    yield this.protocol.rpc.updateFirmware(
      this.currentBuild.checksum,
      this.insecure ? '' : RootCert,
      url.toString(),
      this.insecure
    )
  }
}
