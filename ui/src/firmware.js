import rootCert from './firmware/root.pem?raw'
import esp32BootPartitionUrl from './firmware/partitions/boot_app0.bin?url';

import version from './firmware/version?raw';

import esp32BootLoaderUrl from './firmware/esp32dev/bootloader.bin?url';
import esp32PartitionsUrl from './firmware/esp32dev/partitions.bin?url';
import esp32devFirmwareUrl from './firmware/esp32dev/firmware.bin?url';
import esp32devFirmwareUrlMD5 from './firmware/esp32dev/firmware.md5?raw';

import esp32S3BootLoaderUrl from './firmware/esp32devS3/bootloader.bin?url';
import esp32S3PartitionsUrl from './firmware/esp32devS3/partitions.bin?url';
import esp32S3devFirmwareUrl from './firmware/esp32devS3/firmware.bin?url';
import esp32S3devFirmwareMD5 from './firmware/esp32devS3/firmware.md5?raw';

export const BaudRate = 115200;
export const RootCert = rootCert;
export const Version = version;

export const esp32Dev = {
  chipFamily: "ESP32",
  firmware: esp32devFirmwareUrl,
  checksum: esp32devFirmwareUrlMD5,
  version,
  files: [
    { url: esp32BootLoaderUrl, address: 0x1000 },
    { url: esp32PartitionsUrl, address: 0x8000 },
    { url: esp32BootPartitionUrl, address: 0xe000 },
    { url: esp32devFirmwareUrl, address: 0x10000 },
  ]
}

export const esp32S3Dev = {
  chipFamily: "ESP32-S3",
  firmware: esp32S3devFirmwareUrl,
  checksum: esp32S3devFirmwareMD5,
  version,
  files: [
    { url: esp32S3BootLoaderUrl, address: 0x00000000 },
    { url: esp32S3PartitionsUrl, address:  0x00008000 },
    { url: esp32BootPartitionUrl, address: 0x0000e000 },
    { url: esp32S3devFirmwareUrl, address: 0x00010000 },
  ]
}

export const builds = [
  esp32Dev,
  esp32S3Dev
]

export default builds
