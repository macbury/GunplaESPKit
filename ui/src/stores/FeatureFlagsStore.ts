import { action, makeAutoObservable } from "mobx";

export function calculateSemanticVersion(year: number, month: number, build: number): number {
  const version = year * 10000 + month * 100 + build;
  return version;
}

export function parseSemanticVersion(currentVersion : string) {
  const [year, month, build] = (currentVersion || "0.0.0").split('.')
  return calculateSemanticVersion(parseInt(year), parseInt(month), parseInt(build))
}

export default class FeatureFlagsStore {
  public currentVersion: string
  public version: number

  constructor() {
    makeAutoObservable(this, {
      setCurrentVersion: action.bound
    })

    this.setCurrentVersion("0.0.0")
  }

  public setCurrentVersion(currentVersion) {
    this.currentVersion = currentVersion
    this.version = parseSemanticVersion(currentVersion)
    console.log(`Current version: ${currentVersion} with ver: ${this.version}`)
  }

  private is(year, month, number) {
    return this.version >= calculateSemanticVersion(year, month, number)
  }

  public get hasRGBEditor() {
    return this.is(2024,2, 5);
  }

  public get hasPing() {
    return this.is(2024,1, 27);
  }

  public get hasSystemInfo() {
    return this.is(2024, 1, 20)
  }

  public get hasBluetoothPinChange() {
    return this.is(2024, 1, 20)
  }

  public get hasLightManagement() {
    return this.is(2024, 1, 37)
  }

  public get missingBrowserFeatures() {
    return !this.hasBrowserSerial && !this.hasBrowserBluetooth
  }

  public get hasBrowserSerial() {
    return !!navigator.serial
  }

  public get hasBrowserBluetooth() {
    return !!navigator.bluetooth
  }
}
