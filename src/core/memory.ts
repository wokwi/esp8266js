export interface IMemory {
  readUint8(addr: number): number;
  readUint16(addr: number): number;
  readUint32(addr: number): number;
  writeUint8(addr: number, value: number): void;
  writeUint16(addr: number, value: number): void;
  writeUint32(addr: number, value: number): void;
}

export class Memory implements IMemory {
  constructor(readonly data: Uint8Array, private base: number) {}

  get baseAddr() {
    return this.base;
  }

  contains(addr: number) {
    return addr >= this.base && addr < this.base + this.data.length;
  }

  readUint8(addr: number) {
    const { data, base } = this;
    return data[addr - base];
  }

  readUint16(addr: number) {
    const { data, base } = this;
    return data[addr - base] | (data[addr - base + 1] << 8);
  }

  readUint32(addr: number): number {
    const { data, base } = this;
    const mapped = addr - base;
    return (
      (data[mapped] |
        (data[mapped + 1] << 8) |
        (data[mapped + 2] << 16) |
        (data[mapped + 3] << 24)) >>>
      0
    );
  }

  writeUint8(addr: number, value: number) {
    const { data, base } = this;
    data[addr - base] = value;
  }

  writeUint16(addr: number, value: number) {
    const { data, base } = this;
    data[addr - base] = value & 0xff;
    data[addr - base + 1] = (value >> 8) & 0xff;
  }

  writeUint32(addr: number, value: number) {
    const { data, base } = this;
    const mapped = addr - base;
    data[mapped] = value & 0xff;
    data[mapped + 1] = (value >> 8) & 0xff;
    data[mapped + 2] = (value >> 16) & 0xff;
    data[mapped + 3] = (value >> 24) & 0xff;
  }

  set(array: ArrayLike<number>, addr: number) {
    this.data.set(array, addr - this.base);
  }

  createView(baseAddr: number, offset: number, size: number) {
    return new Memory(this.data.subarray(offset, offset + size), baseAddr);
  }

  remap(newBase: number) {
    return new Memory(this.data, newBase);
  }
}

export class ReadonlyMemory extends Memory {
  static override = false;

  writeUint8(addr: number, value: number): void {
    if (ReadonlyMemory.override) {
      return super.writeUint8(addr, value);
    }
    console.error('Invalid write to read-only memory at', addr.toString(16));
  }

  writeUint16(addr: number, value: number): void {
    if (ReadonlyMemory.override) {
      return super.writeUint16(addr, value);
    }
    console.error('Invalid write to read-only memory at', addr.toString(16));
  }

  writeUint32(addr: number, value: number): void {
    if (ReadonlyMemory.override) {
      return super.writeUint32(addr, value);
    }
    console.error('Invalid write to read-only memory at', addr.toString(16));
  }

  createView(baseAddr: number, offset: number, size: number) {
    return new ReadonlyMemory(this.data.subarray(offset, offset + size), baseAddr);
  }
}

export class InvalidMemory implements IMemory {
  constructor(private defaultValue = 0xffffffff) {}

  readUint8() {
    return this.defaultValue & 0xff;
  }

  readUint16() {
    return this.defaultValue & 0xffff;
  }

  readUint32() {
    return this.defaultValue & 0xffffffff;
  }

  writeUint8() {}

  writeUint16() {}

  writeUint32() {}
}
