import { ESP8266 } from '../esp8266';
import { BasePeripheral } from './base-peripheral';

const FRC_TIMER_LOAD_REG = 0x0;
const FRC_TIMER_COUNT_REG = 0x04;
const FRC_TIMER_CTRL_REG = 0x08;
const FRC_TIMER_INT_REG = 0xc;
const FRC_TIMER_ALARM_REG = 0x10;

// FRC_TIMER_CTRL_REG bits
const FRC_TIMER_INT_STATUS = 1 << 8; // Interrupt status (RO)
const FRC_TIMER_ENABLE = 1 << 7; // Enable timer
const FRC_TIMER_AUTOLOAD = 1 << 6; // Enable autoload
const FRC_TIMER_LEVEL_INT = 1 << 0; // 1: level, 0: edge

class FRCTimer {
  private baseValue = 0;
  private baseNanos = 0;

  private loadReg = 0;
  private ctrlReg = 0;
  private alarmReg = 0;
  private alarmScheduled = false;

  readonly mask = this.index === 0 ? 0x007fffff : 0xffffffff; // Timer 0 only has 23 bits

  constructor(private esp: ESP8266, readonly index: number, readonly irq: number) {}

  private get prescaler() {
    switch ((this.ctrlReg >> 1) & 7) {
      case 0:
        return 1;
      case 2:
        return 16;
      case 4:
        return 256;
      default:
        return 1;
    }
  }

  get timerValue() {
    return (
      ((this.baseValue +
        (((this.esp.clock.nanos - this.baseNanos) / 1000000) * this.esp.clocks.apbFreq) /
          1000 /
          this.prescaler) &
        this.mask) >>>
      0
    );
  }

  readUint32(register: number) {
    switch (register) {
      case FRC_TIMER_LOAD_REG:
        return this.loadReg >>> 0;
      case FRC_TIMER_CTRL_REG:
        return this.ctrlReg;
      case FRC_TIMER_COUNT_REG:
        if (this.ctrlReg & FRC_TIMER_ENABLE) {
          return this.timerValue;
        } else {
          return this.baseValue;
        }
      case FRC_TIMER_ALARM_REG:
        return this.alarmReg;
    }

    return 0;
  }

  scheduleAlarm() {
    if (!(this.ctrlReg & FRC_TIMER_ENABLE) || this.index === 0) {
      return;
    }

    const ticksToAlarm = (this.alarmReg - this.timerValue) >>> 0;
    const nanosToAlarm = (ticksToAlarm * this.prescaler * 1_000_000_000) / this.esp.clocks.apbFreq;
    if (this.alarmScheduled) {
      this.esp.clock.unschedule(this.onAlarm);
    }
    this.esp.clock.schedule(this.onAlarm, nanosToAlarm);
    this.alarmScheduled = true;
  }

  onAlarm = () => {
    this.ctrlReg |= FRC_TIMER_INT_STATUS;
    this.alarmScheduled = false;
    if (this.ctrlReg & FRC_TIMER_AUTOLOAD) {
      this.scheduleAlarm();
    }
    this.updateInterrupts();
  };

  updateInterrupts() {
    const intStatus = this.ctrlReg & FRC_TIMER_INT_STATUS;
    this.esp.interrupt(this.irq, !!intStatus);
  }

  writeUint32(register: number, value: number) {
    switch (register) {
      case FRC_TIMER_LOAD_REG:
        this.loadReg = value & this.mask;
        this.baseValue = value & this.mask;
        this.baseNanos = this.esp.clock.nanos;
        this.scheduleAlarm();
        break;
      case FRC_TIMER_CTRL_REG:
        if (this.ctrlReg & FRC_TIMER_ENABLE) {
          this.baseValue = this.timerValue;
          this.baseNanos = this.esp.clock.nanos;
        }
        this.ctrlReg = value;
        if (value & FRC_TIMER_ENABLE) {
          this.scheduleAlarm();
        }
        break;
      case FRC_TIMER_INT_REG:
        if (value & 0x1) {
          this.ctrlReg &= ~FRC_TIMER_INT_STATUS;
          this.updateInterrupts();
        }
        break;
      case FRC_TIMER_ALARM_REG:
        this.alarmReg = value;
        this.scheduleAlarm();
        break;
    }
  }
}

/*
 * FRC: Free running counter
 */
export class ESPFRC extends BasePeripheral {
  readonly timers;

  constructor(esp: ESP8266, baseAddr: number, name: string, timer1Irq: number) {
    super(esp, baseAddr, name);
    this.timers = [new FRCTimer(esp, 0, -1), new FRCTimer(esp, 1, timer1Irq)];
  }

  readUint32(addr: number) {
    const offset = addr - this.baseAddr;
    if (offset < 0x20) {
      return this.timers[0].readUint32(offset);
    } else if (offset < 0x40) {
      return this.timers[1].readUint32(offset - 0x20);
    }
    return super.readUint32(addr);
  }

  writeUint32(addr: number, value: number) {
    const offset = addr - this.baseAddr;
    if (offset < 0x20) {
      this.timers[0].writeUint32(offset, value);
    } else if (offset < 0x40) {
      this.timers[1].writeUint32(offset - 0x20, value);
    } else {
      super.writeUint32(addr, value);
    }
  }

  reset() {
    super.reset();
  }
}
