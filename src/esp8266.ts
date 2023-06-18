import { ISimulationClock, SimulationClock } from './clock/simulation-clock';
import { ESP8266Clocks } from './core/clocks';
import { esp8266GDBRegisters } from './core/gdb-registers';
import { ESP8266Interrupts } from './core/int';
import { LX106Core } from './core/lx106-core';
import { IMemory, InvalidMemory, Memory, ReadonlyMemory } from './core/memory';
import { INTSET } from './core/xtensa-regs';
import { IPeripheral, UnimplementedPeripheral } from './peripherals/base-peripheral';
import { ESP8266DPort } from './peripherals/dport';
import { ESPFRC } from './peripherals/frc';
import { ESP8266GPIO } from './peripherals/gpio';
import { ESP8266HDRF } from './peripherals/hdrf';
import { ESP8266IOMUX } from './peripherals/iomux';
import { ESP8266RTC } from './peripherals/rtc';
import { ESP8266SAR } from './peripherals/sar';
import { ESP8266SPI, ISPIConfig } from './peripherals/spi';
import { ESP8266UART } from './peripherals/uart';
import { ESP8266WDev } from './peripherals/wdev';

export interface IESP8266Config {
  clock?: ISimulationClock;
  flashSizeMB?: 1 | 2 | 4 | 8;
}

const MB = 1024 * 1024;
const DPORT_START = 0x3ff00000;
const DPORT_END = DPORT_START + 0x10000;
const WDEV_START = 0x3ff20000;
const WDEV_END = 0x3ff22000;
const ROM1_START = 0x3ff90000;
const DATA_START = 0x3ffe8000;
const IRAM_START = 0x40100000;
const IRAM_END = 0x40140000;
const INSTRUCTIONS_START = 0x40000000;
const CHIP_ROM_SIZE = 0x10000;
const RTC_SLOW_START = 0x60001200;
const AHB_START = 0x60000000;
const AHB_END = 0x60040000;

export class ESP8266 {
  readonly flash = new Uint8Array((this.config.flashSizeMB ?? 4) * MB);
  readonly flashMemory = new ReadonlyMemory(this.flash, 0x40200000);
  readonly chipROM = new ReadonlyMemory(new Uint8Array(CHIP_ROM_SIZE), INSTRUCTIONS_START);
  readonly rom1 = this.chipROM.createView(ROM1_START, 0x60000, 0x10000);
  readonly iram = new Memory(new Uint8Array(IRAM_END - IRAM_START), IRAM_START);
  readonly dataMem = new Memory(new Uint8Array(INSTRUCTIONS_START - DATA_START), DATA_START);
  readonly rtcSlowMem = new Memory(new Uint8Array(8 * 1024), RTC_SLOW_START);
  readonly invalidMem = new InvalidMemory();
  readonly dmaBase: number = 0x3ff00000;

  readonly peripherals: IPeripheral[];
  readonly peripheralMap: { [addr: number]: IMemory } = {};
  readonly uart: ESP8266UART[];
  readonly spi: ESP8266SPI[];
  readonly gpio: ESP8266GPIO;

  resetReason = 1;
  onReset = () => true;
  onAnalogRead = () => 0;

  readonly cores: LX106Core[] = [new LX106Core(this, 'MAIN', esp8266GDBRegisters)];

  // Clocks
  readonly clock = this.config.clock ?? new SimulationClock(80_000_000, this);
  readonly clocks = new ESP8266Clocks(this.clock);
  public cycles = 0;

  stopped = true;
  onBreak: (core: LX106Core) => void | null;
  readonly writeWatchPoints = new Set<number>();

  lastMappedAddress = 0;

  constructor(readonly config: IESP8266Config = {}) {
    this.flash.fill(0xff);
    const spiConfig: ISPIConfig = {
      flash: false,
      irq: ESP8266Interrupts.ETS_SPI,
    };
    this.uart = [
      new ESP8266UART(this, 0x60000000, 'UART0', 0, ESP8266Interrupts.ETS_UART),
      new ESP8266UART(this, 0x60000f00, 'UART1', 1, -1),
    ];
    this.spi = [
      new ESP8266SPI(this, 0x60000100, 'SPI1', spiConfig),
      new ESP8266SPI(this, 0x60000200, 'SPI0', { ...spiConfig, flash: true }),
    ];
    this.gpio = new ESP8266GPIO(this, 0x60000300, 'GPIO', ESP8266Interrupts.ETS_GPIO);
    this.peripherals = [
      this.gpio,
      ...this.uart,
      ...this.spi,
      new ESP8266DPort(this, DPORT_START, 'DPort Register'),
      new ESP8266WDev(this, WDEV_START, 'WDEV'),
      new ESP8266HDRF(this, 0x60000500, 'HDRF'),
      new ESPFRC(this, 0x60000600, 'FRC', ESP8266Interrupts.ETS_FRC_TIMER1),
      new ESP8266RTC(this, 0x60000700, 'RTC'),
      new ESP8266IOMUX(this, 0x60000800, 'IO MUX', this.gpio),
      new UnimplementedPeripheral(this, 0x60000900, 'WDT'),
      new UnimplementedPeripheral(this, 0x60000a00, 'SDIO'),
      new UnimplementedPeripheral(this, 0x60000b00, 'SLC0'),
      new ESP8266SAR(this, 0x60000d00, 'SAR'),
      new UnimplementedPeripheral(this, 0x60000e00, 'I2S0'),
      new UnimplementedPeripheral(this, 0x60001000, 'rtc_data'),
      new UnimplementedPeripheral(this, 0x60001100, 'rtc_sys_info'),
    ];
    for (const peripheral of this.peripherals) {
      this.peripheralMap[peripheral.baseAddr] = peripheral;
    }
    this.reset();
  }

  loadROM(binary: Uint8Array) {
    this.chipROM.set(binary, INSTRUCTIONS_START);
  }

  reset() {
    for (const core of this.cores) {
      core.reset();
    }
    for (const peripheral of this.peripherals) {
      peripheral.reset();
    }
  }

  mapAddress(addr: number): IMemory {
    this.lastMappedAddress = addr;

    if (addr >= DPORT_START && addr < DPORT_END) {
      return this.peripherals.find((p) => p.baseAddr === DPORT_START)!;
    }
    if (addr >= WDEV_START && addr < WDEV_END) {
      return this.peripherals.find((p) => p.baseAddr === WDEV_START)!;
    }

    if (addr >= AHB_START && addr <= AHB_END) {
      const peripheral = this.peripheralMap[addr & 0xffffff00];
      if (peripheral) {
        return peripheral;
      }
    }
    if (addr >= DATA_START && addr < INSTRUCTIONS_START) {
      return this.dataMem;
    }
    if (addr >= ROM1_START && addr < DATA_START) {
      return this.rom1;
    }
    if (addr >= INSTRUCTIONS_START && addr < INSTRUCTIONS_START + CHIP_ROM_SIZE) {
      return this.chipROM;
    }
    if (addr >= IRAM_START && addr < IRAM_END) {
      return this.iram;
    }
    if (this.flashMemory.contains(addr)) {
      return this.flashMemory;
    }
    return this.invalidMem;
  }

  step() {
    this.cores[0].runInstruction();
    this.cycles++;
    if (this.clock instanceof SimulationClock) {
      this.clock.tick();
    }
  }

  get coresIdle() {
    const { cores } = this;
    return cores[0].idle && !cores[0].pendingInterrupts;
  }

  get refNanos() {
    return this.clock.nanos;
  }

  interrupt(index: number, set = true) {
    if (index < 0) {
      return;
    }
    const core = this.cores[0];
    if (set) {
      core.specialRegisters[INTSET] |= 1 << index;
    } else {
      core.specialRegisters[INTSET] &= ~(1 << index);
    }
    core.pendingInterrupts = !!core.specialRegisters[INTSET];
  }

  get apbNanos() {
    return 1e9 / this.clocks.apbFreq;
  }

  get devices() {
    return {
      nonvolatile: { flash: this.flash },
      volatile: {
        iram: this.iram.data,
        dram: this.dataMem.data,
        rtc: this.rtcSlowMem.data,
      },
    };
  }
}
