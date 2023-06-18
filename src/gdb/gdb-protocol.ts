import { LX106Core } from '../core/lx106-core';
import { ReadonlyMemory } from '../core/memory';
import { ESP8266 } from '../esp8266';
import { Simulator } from '../sim/simulator';
import { hexByte, hexlify, unhexlify } from '../utils/hex';

export const gdbSIGINT = gdbResponse('S02');
export const gdbBreak = (thread: number) => gdbResponse(`T05thread:${thread};`);

export function gdbChecksum(text: string) {
  return hexByte(
    text
      .split('')
      .map((c) => c.charCodeAt(0))
      .reduce((a, b) => a + b, 0) & 0xff
  );
}

function gdbResponse(message: string) {
  return `+$${message}#${gdbChecksum(message)}`;
}

export function gdb(simulator: Simulator, esp: ESP8266, cmd: string) {
  const cpu = esp.cores[0];
  if (cmd.startsWith('qSupported')) {
    return gdbResponse('PacketSize=1000;qXfer:threads:read+'); // 0x1000 = 4096
  } else if (cmd.startsWith('qAttached')) {
    return gdbResponse('1');
  } else if (cmd.startsWith('qfThreadInfo')) {
    return gdbResponse('m 1');
  } else if (cmd.startsWith('qsThreadInfo')) {
    return gdbResponse('l');
  } else if (cmd.startsWith('qXfer:threads:read::')) {
    return gdbResponse(`l<?xml version="1.0"?><threads><thread id="1" /></threads>`);
  } else if (cmd.startsWith('qRcmd,')) {
    const monitorCmd = Array.from(unhexlify(cmd.split(',')[1]))
      .map((code) => String.fromCharCode(code))
      .join('');
    if (monitorCmd === 'system_reset' || monitorCmd === 'reset') {
      esp.reset();
      return gdbResponse('OK');
    } else {
      return gdbResponse('E00');
    }
  } else if (cmd === '?') {
    return gdbResponse('S05');
  } else if (cmd === 'qC') {
    return gdbResponse(`QC 01`);
  } else if (cmd === 'Hg1') {
    return gdbResponse('OK');
  } else if (cmd === 's') {
    cpu.runInstruction();
    return gdbResponse('S05');
  } else if (cmd === 'c') {
    simulator.execute();
    return null;
  } else if (cmd === 'g') {
    // Read registers
    const registers = new Uint32Array(cpu.gdbRegisterCount);
    for (let i = 0; i < registers.length; i++) {
      registers[i] = cpu.gdbReadRegister(i);
    }
    return gdbResponse(hexlify(new Uint8Array(registers.buffer)));
  } else if (cmd.startsWith('G')) {
    // Write registers
    const registers = new Uint32Array(unhexlify(cmd.substr(1)).buffer);
    if (cpu && registers.length >= cpu.gdbRegisterCount) {
      for (let i = 0; i < registers.length; i++) {
        cpu.gdbWriteRegister(i, registers[i]);
      }
      return gdbResponse('OK');
    } else {
      return gdbResponse('E00');
    }
  } else if (cmd.startsWith('m')) {
    // Read memory
    const [addrStr, sizeStr] = cmd.substring(1).split(',');
    const addr = parseInt(addrStr, 16);
    const size = parseInt(sizeStr, 16);
    if (!size || size >= 0x10000) {
      return gdbResponse('E05'); // EIO
    }
    const buf = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      buf[i] = cpu.readUint8(addr + i);
    }
    return gdbResponse(hexlify(buf));
  } else if (cmd.startsWith('M')) {
    // Write memory
    const [addrStr, sizeStr, dataStr] = cmd.substring(1).split(/[,:]/);
    const addr = parseInt(addrStr, 16);
    const size = parseInt(sizeStr, 16);
    const data = unhexlify(dataStr).slice(0, size);
    const prevOverride = ReadonlyMemory.override;
    ReadonlyMemory.override = true;
    for (let i = 0; i < size; i++) {
      cpu.writeUint8(addr + i, data[i]);
    }
    ReadonlyMemory.override = prevOverride;
    return gdbResponse('OK');
  } else if (cmd === 'T1') {
    return gdbResponse('OK');
  } else if (cmd === 'T2') {
    return gdbResponse('E 00');
  } else if (cmd.startsWith('Z0,')) {
    const addr = parseInt(cmd.split(',')[1], 16);
    if (!cpu.breakpoints) {
      cpu.breakpoints = {};
    }
    cpu.breakpoints[addr] = (core: LX106Core) => {
      esp.onBreak?.(core);
      return true;
    };
    return gdbResponse('OK');
  } else if (cmd.startsWith('z0,')) {
    const addr = parseInt(cmd.split(',')[1], 16);
    for (const core of esp.cores) {
      if (!core.breakpoints) {
        continue;
      }
      delete core.breakpoints[addr];
    }
    return gdbResponse('OK');
  } else if (cmd.startsWith('Z2,')) {
    const addr = parseInt(cmd.split(',')[1], 16);
    esp.writeWatchPoints.add(addr);
    return gdbResponse('OK');
  } else if (cmd.startsWith('z2,')) {
    const addr = parseInt(cmd.split(',')[1], 16);
    esp.writeWatchPoints.delete(addr);
    return gdbResponse('OK');
  } else {
    return gdbResponse('');
  }
}
