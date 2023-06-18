import { BasePeripheral, IPeripheral } from './base-peripheral';

const RTC_RESET_REASON = 0x14;

export class ESP8266RTC extends BasePeripheral implements IPeripheral {
  readUint32(addr: number) {
    const offset = addr - this.baseAddr;
    switch (offset) {
      case 0x08:
        return 0;

      case RTC_RESET_REASON:
        return 4;

      case 0x18:
        return 5;

      case 0x28:
        return 1;
    }
    return super.readUint32(addr);
  }
}
