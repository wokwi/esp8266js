import { IMemory } from '../core/memory';
import { ESP8266 } from '../esp8266';

export const PeripheralBlockSize = 4096; // bytes

export interface IPeripheral extends IMemory {
  name: string;
  baseAddr: number;

  reset(): void;
}

export class BasePeripheral implements IPeripheral {
  protected readonly memory = new Uint8Array(PeripheralBlockSize);
  protected readonly memoryView = new DataView(this.memory.buffer);

  constructor(protected readonly esp: ESP8266, readonly baseAddr: number, readonly name: string) {}

  readUint8(addr: number) {
    return this.memory[addr - this.baseAddr];
  }

  readUint16(addr: number) {
    return this.memoryView.getUint16(addr - this.baseAddr, true);
  }

  readUint32(addr: number) {
    return this.memoryView.getUint32(addr - this.baseAddr, true);
  }

  writeUint8(addr: number, value: number) {
    this.memory[addr - this.baseAddr] = value;
  }

  writeUint16(addr: number, value: number) {
    this.memoryView.setUint16(addr - this.baseAddr, value, true);
  }

  writeUint32(addr: number, value: number) {
    this.memoryView.setUint32(addr - this.baseAddr, value, true);
  }

  reset() {
    this.memory.fill(0);
  }

  protected readRegister(offset: number) {
    return this.memoryView.getUint32(offset, true);
  }

  protected writeRegister(offset: number, value: number) {
    this.memoryView.setUint32(offset, value, true);
  }

  protected setRegisterBits(offset: number, mask: number) {
    const newValue = this.readRegister(offset) | mask;
    this.writeRegister(offset, newValue);
    return newValue;
  }

  protected clearRegisterBits(offset: number, mask: number) {
    const newValue = this.readRegister(offset) & ~mask;
    this.writeRegister(offset, newValue);
    return newValue;
  }
}

export class UnimplementedPeripheral extends BasePeripheral {}
