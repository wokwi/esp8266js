import { BasePeripheral } from './base-peripheral';

export class ESP8266HDRF extends BasePeripheral {
  readUint32(addr: number) {
    switch (addr - this.baseAddr) {
      case 0x7c: // read by rom_iq_est_enable()
        return 0xffff_ffff;
    }

    return super.readUint32(addr);
  }
}
