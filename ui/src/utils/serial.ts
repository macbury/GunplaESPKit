import { Transport } from "esptool-js";
import { sleep } from "./time"

export async function resetSerialDevice(transport: Transport) {
  await transport.setRTS(true); // EN->LOW
  await sleep(100);
  await transport.setRTS(false);
};

export function loadAsString(blob : Blob) {
  const reader = new FileReader();

  return new Promise<string>((resolve) => {
    reader.addEventListener("load", () => resolve(reader.result as string));
    reader.readAsBinaryString(blob);
  });
}

export async function download(firmware) {
  const files: Array<{ data: string; address: number }> = [];

  for (let index = 0; index < firmware.files.length; index++) {
    const { url, address } = firmware.files[index];

    console.log(`Download: ${url}`)

    const req = await fetch(url)
    const blob = await req.blob()
    const data = await loadAsString(blob);

    files.push({ address, data })
  }

  return files;
}
