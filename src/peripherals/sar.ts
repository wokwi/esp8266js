import { BasePeripheral } from './base-peripheral';

export class ESP8266SAR extends BasePeripheral {
  readUint32(addr: number) {
    switch (addr - this.baseAddr) {
      case 0x4: // fixes error: pll_cal exceeds 2ms!!!
        return 0xfdffffff;

      case 50: // read by ram_get_fm_sar_dout()
        return 0xff;
    }

    return super.readUint32(addr);
  }
}
