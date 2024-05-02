import { flow, makeAutoObservable, runInAction } from "mobx";
import { ESPLoader, Transport } from "esptool-js";
import { sleep } from "../utils/time";
import { download } from "../utils/serial";
import builds from "../firmware"

export const GUNDAM_KIT_BAUD_RATE = 115200
export type SupportedPlatforms = "ESP32" | "ESP32S2" | "ESP32S3" | "ESP32C3";
export enum InstallFirmwareState {
  Pending,
  OpeningPort,
  DetectingChip,
  Erasing,
  Downloading,
  Writing,
  Resetting,
  Failed,
  Success
}

export class InstallFirmwareStore {
  public port : SerialPort
  public state: InstallFirmwareState;
  public transport: Transport;
  public progress : number
  public chipId: SupportedPlatforms
  public mac: string
  public logs: string
  private wakeLock: WakeLockSentinel

  constructor() {
    this.state = InstallFirmwareState.Pending;
    this.transport = null;
    this.progress = 0;
    this.mac = ''
    this.logs = ''

    makeAutoObservable(this, {
      openDevice: flow.bound,
      port: false,
      transport: false
    });
  }

  public get bluetoothName() : string {
    const parts = this.mac.split(':')
    if (parts.length <= 1) {
      return 'Please wait...'
    }

    const code = `${parts[5]}${parts[4]}`.toLocaleUpperCase();
    return `GunplaESPKit: ${code}`;
  }

  public *openDevice() {
    this.state = InstallFirmwareState.Pending
    this.port = yield navigator.serial.requestPort()
    this.wakeLock = yield navigator.wakeLock.request('screen');
    // this.port.addEventListener('disconnect', this.disconnect)
  }

  public *start() {
    if (this.state != InstallFirmwareState.Pending) {
      console.error("Already running install...")
      return false
    }
    this.logs = ''
    this.progress = 0
    this.state = InstallFirmwareState.Pending;
    this.transport = new Transport(this.port)

    console.log('info', this.transport.get_info())

    const loader = new ESPLoader({
      transport: this.transport,
      baudrate: GUNDAM_KIT_BAUD_RATE,
      romBaudrate: GUNDAM_KIT_BAUD_RATE,
      // debugLogging: true,
      terminal: {
        clean: () => {
          runInAction(() => {
            this.logs = "";
          });
        },
        writeLine: (data) => {
          runInAction(() => {
            this.logs += data + "\n";
          })
        },
        write: (data) => {
          runInAction(() => {
            this.logs += data
          })
        }
      }
    });

    try {
      console.log('Fetching main fn')
      this.state = InstallFirmwareState.OpeningPort;
      yield loader.main_fn()
      this.state = InstallFirmwareState.DetectingChip
      console.log("Flash id");
      yield loader.flash_id();
      this.chipId = loader.chip.CHIP_NAME as any;
      this.mac = yield loader.chip.read_mac(loader);
      // console.log("Cleaning flash");
      // this.state = InstallFirmwareState.Erasing
      // yield loader.erase_flash();
    } catch (err) {
      this.state = InstallFirmwareState.Failed
      yield this.reset()
      yield this.transport.disconnect()

      console.error(err);
      console.log("Failed to initialize. Try resetting your device or holding the BOOT button while selecting your serial port until it starts preparing the installation.");
      throw err
    }

    this.state = InstallFirmwareState.Downloading
    const chip = builds.find(({ chipFamily }) => chipFamily == this.chipId)
    console.log('found chip', chip)

    if (!chip) {
      console.error('Unsupported chip', this.chipId)
      return false
    }

    const fileArray = yield download(chip)

    this.state = InstallFirmwareState.Writing
    yield loader.write_flash({
      fileArray,
      flashSize: "keep",
      flashMode: "keep",
      flashFreq: "keep",
      eraseAll: false,
      compress: true,
      reportProgress: (fileIndex: number, written: number, total: number) => {
        // console.log(`I: ${fileIndex} ${written}/${total}`)
        runInAction(() => this.progress = Math.round((written/total) * 100.0))
      }
    })

    this.state = InstallFirmwareState.Resetting
    yield this.reset()
    yield this.transport.disconnect()
    this.state = InstallFirmwareState.Success
    this.transport = null;
    this.chipId = null;

    return true
  }

  public async reset() {
    await this.transport.setRTS(true); // EN->LOW
    await sleep(100);
    await this.transport.setRTS(false);
  }

  public cleanup() {
    this.wakeLock?.release()
    this.port?.close();
    this.mac = ''
  }
}
