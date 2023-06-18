import { ESP8266 } from '../esp8266';
import { BasePeripheral } from './base-peripheral';
import { ESP8266GPIO } from './gpio';

const FUN_OE = 1 << 0;
const FUN_WPD = 1 << 6;
const FUN_WPU = 1 << 7;

enum PinFunction {
  GPIO,
  MTDI,
  MTCK,
  MTMS,
  MTDO,
  U0RXD,
  U0TXD,
  SD_CLK,
  SD_DATA0,
  SD_DATA1,
  SD_DATA2,
  SD_DATA3,
  SD_CMD,
  I2SI_DATA,
  I2SI_BCK,
  I2SI_WS,
  I2SO_BCK,
  I2SO_DATA,
  SPICS1,
  SPI_CLK,
  SPIQ,
  SPID,
  SPIHD,
  SPIWP,
  SPICS0,
  HSPIQ,
  HSPID,
  HSPICLK,
  HSPICS,
  SPICS2,
  I2SOWS,
  U0DTR,
  U0CTS,
  U0DSR,
  U0RTS,
  CLK_XTAL,
  CLK_RTC,
  U1CTS,
  U1TXD,
  U1RXD,
  HSPIHD,
  HSPIWP,
  U1RTS,
  CLK_OUT,
}

const FN = PinFunction;
const pins = [
  null,
  { index: 12, fn: [FN.MTDI, FN.I2SI_DATA, FN.HSPIQ, FN.GPIO, FN.U0DTR] },
  { index: 13, fn: [FN.MTCK, FN.I2SI_BCK, FN.HSPID, FN.GPIO, FN.U0CTS] },
  { index: 14, fn: [FN.MTMS, FN.I2SI_WS, FN.HSPICLK, FN.GPIO, FN.U0DSR] },
  { index: 15, fn: [FN.MTDO, FN.I2SO_BCK, FN.HSPICS, FN.GPIO, FN.U0RTS] },
  { index: 3, fn: [FN.U0RXD, FN.I2SO_DATA, null, FN.GPIO, FN.CLK_XTAL] },
  { index: 1, fn: [FN.U0TXD, FN.SPICS1, null, FN.GPIO, FN.CLK_RTC] },
  { index: 6, fn: [FN.SD_CLK, FN.SPI_CLK, null, FN.GPIO, FN.U1CTS] },
  { index: 7, fn: [FN.SD_DATA0, FN.SPIQ, null, FN.GPIO, FN.U1TXD] },
  { index: 8, fn: [FN.SD_DATA1, FN.SPID, null, FN.GPIO, FN.U1RXD] },
  { index: 9, fn: [FN.SD_DATA2, FN.SPIHD, null, FN.GPIO, FN.HSPIHD] },
  { index: 10, fn: [FN.SD_DATA3, FN.SPIWP, null, FN.GPIO, FN.HSPIWP] },
  { index: 11, fn: [FN.SD_CMD, FN.SPICS0, null, FN.GPIO, FN.U1RTS] },
  { index: 0, fn: [FN.GPIO, FN.SPICS2, null, null, FN.CLK_OUT] },
  { index: 2, fn: [FN.GPIO, FN.I2SOWS, FN.U1TXD, null, FN.U0TXD] },
  { index: 4, fn: [FN.GPIO, FN.CLK_XTAL, null, null] },
  { index: 5, fn: [FN.GPIO, FN.CLK_RTC, null, null] },
];

export class ESP8266IOMUX extends BasePeripheral {
  constructor(esp: ESP8266, baseAddr: number, name: string, readonly gpio: ESP8266GPIO) {
    super(esp, baseAddr, name);
  }

  writeUint32(addr: number, value: number) {
    const offset = addr - this.baseAddr;
    const pinInfo = pins[offset >> 2];
    if (pinInfo) {
      const { index } = pinInfo;
      this.gpio.pins[index].gpioOutputEnable = !!(value & FUN_OE);
      this.gpio.pins[index].internalPullDown = !!(value & FUN_WPD);
      this.gpio.pins[index].internalPullUp = !!(value & FUN_WPU);
      this.gpio.updateGPIO();
    }
    super.writeUint32(addr, value);
  }

  reset() {
    super.reset();
    this.writeUint32(this.baseAddr + 4, 0x00000080);
    this.writeUint32(this.baseAddr + 8, 0x00000080);
    this.writeUint32(this.baseAddr + 12, 0x00000080);
    this.writeUint32(this.baseAddr + 16, 0x00000080);
    this.writeUint32(this.baseAddr + 20, 0x00000080);
    this.writeUint32(this.baseAddr + 24, 0x00000000);
    this.writeUint32(this.baseAddr + 28, 0x00000010);
    this.writeUint32(this.baseAddr + 32, 0x00000010);
    this.writeUint32(this.baseAddr + 36, 0x00000010);
    this.writeUint32(this.baseAddr + 40, 0x00000010);
    this.writeUint32(this.baseAddr + 44, 0x00000010);
    this.writeUint32(this.baseAddr + 48, 0x00000010);
    this.writeUint32(this.baseAddr + 52, 0x00000080);
    this.writeUint32(this.baseAddr + 56, 0x000000a0);
    this.writeUint32(this.baseAddr + 60, 0x00000000);
    this.writeUint32(this.baseAddr + 64, 0x00000000);
  }
}
