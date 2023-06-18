import { BasePeripheral } from './base-peripheral';

export class ESP8266WDev extends BasePeripheral {
  protected readonly memory = new Uint8Array(0x2000);
  protected readonly memoryView = new DataView(this.memory.buffer);

  readUint32(addr: number) {
    const offset = addr - this.baseAddr;
    switch (offset) {
      case 0xe44: // RNG, read by esp_random()
        return Math.floor(Math.random() * 0x1_0000_0000);
    }

    return super.readUint32(addr);
  }

  writeUint32(addr: number, value: number) {
    const offset = addr - this.baseAddr;
    switch (offset) {
    }

    super.writeUint32(addr, value);
  }
}
