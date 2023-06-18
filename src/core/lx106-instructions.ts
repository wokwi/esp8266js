import { ExceptionCause } from './exceptions';
import { DEBUGCAUSE, EPC1, EPC2, EPS2, PS, SCOMPARE1 } from './xtensa-regs';
import { LX106Core } from './lx106-core';

function signExtend8(value: number) {
  return value | (value & 0x0080 ? 0xffffff00 : 0);
}

function signExtend12(value: number) {
  return value | (value & 0x0800 ? 0xfffff000 : 0);
}

function signExtend16(value: number) {
  return value | (value & 0x8000 ? 0xffff0000 : 0);
}

function signExtend18(value: number) {
  return value | (value & 0x20000 ? 0xfffc0000 : 0);
}

const B4CONST = [-1, 1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 16, 32, 64, 128, 256];
const B4CONSTU = [32768, 65536, 2, 3, 4, 5, 6, 7, 8, 10, 12, 16, 32, 64, 128, 256];

function instABS(cpu: LX106Core, opcode: number) {
  const r = (opcode >> 12) & 15;
  const t = (opcode >> 4) & 15;
  const input = cpu.AR(t) | 0;
  cpu.setAR(r, input < 0 ? -input : input);
}
function instADD(cpu: LX106Core, opcode: number) {
  const r = (opcode >> 12) & 15;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  cpu.setAR(r, cpu.AR(s) + cpu.AR(t));
}
function instADD_N(cpu: LX106Core, opcode: number) {
  const r = (opcode >> 12) & 15;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  cpu.setAR(r, cpu.AR(s) + cpu.AR(t));
}
function instADDI(cpu: LX106Core, opcode: number) {
  const imm8 = (opcode >> 16) & 255;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  cpu.setAR(t, cpu.AR(s) + signExtend8(imm8));
}
function instADDI_N(cpu: LX106Core, opcode: number) {
  const r = (opcode >> 12) & 15;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  cpu.setAR(r, cpu.AR(s) + (t ? t : -1));
}
function instADDMI(cpu: LX106Core, opcode: number) {
  const imm8 = (opcode >> 16) & 255;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  cpu.setAR(t, cpu.AR(s) + (signExtend8(imm8) << 8));
}
function instADDX2(cpu: LX106Core, opcode: number) {
  const r = (opcode >> 12) & 15;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  cpu.setAR(r, (cpu.AR(s) << 1) + cpu.AR(t));
}
function instADDX4(cpu: LX106Core, opcode: number) {
  const r = (opcode >> 12) & 15;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  cpu.setAR(r, (cpu.AR(s) << 2) + cpu.AR(t));
}
function instADDX8(cpu: LX106Core, opcode: number) {
  const r = (opcode >> 12) & 15;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  cpu.setAR(r, (cpu.AR(s) << 3) + cpu.AR(t));
}
function instALL4(cpu: LX106Core, opcode: number) {
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  cpu.setBR(t, cpu.BR(s + 3) && cpu.BR(s + 2) && cpu.BR(s + 1) && cpu.BR(s));
}
function instALL8(cpu: LX106Core, opcode: number) {
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  cpu.setBR(
    t,
    cpu.BR(s + 7) &&
      cpu.BR(s + 6) &&
      cpu.BR(s + 5) &&
      cpu.BR(s + 4) &&
      cpu.BR(s + 3) &&
      cpu.BR(s + 2) &&
      cpu.BR(s + 1) &&
      cpu.BR(s)
  );
}
function instAND(cpu: LX106Core, opcode: number) {
  const r = (opcode >> 12) & 15;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  cpu.setAR(r, cpu.AR(s) & cpu.AR(t));
}
function instANDB(cpu: LX106Core, opcode: number) {
  const r = (opcode >> 12) & 15;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  cpu.setBR(r, cpu.BR(s) && cpu.BR(t));
}
function instANDBC(cpu: LX106Core, opcode: number) {
  const r = (opcode >> 12) & 15;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  cpu.setBR(r, cpu.BR(s) && !cpu.BR(t));
}
function instANY4(cpu: LX106Core, opcode: number) {
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  cpu.setBR(t, cpu.BR(s + 3) || cpu.BR(s + 2) || cpu.BR(s + 1) || cpu.BR(s));
}
function instANY8(cpu: LX106Core, opcode: number) {
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  cpu.setBR(
    t,
    cpu.BR(s + 7) ||
      cpu.BR(s + 6) ||
      cpu.BR(s + 5) ||
      cpu.BR(s + 4) ||
      cpu.BR(s + 3) ||
      cpu.BR(s + 2) ||
      cpu.BR(s + 1) ||
      cpu.BR(s)
  );
}
function instBALL(cpu: LX106Core, opcode: number) {
  const imm8 = (opcode >> 16) & 255;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  if (!(~cpu.AR(s) & cpu.AR(t))) {
    cpu.nextPC = cpu.PC + signExtend8(imm8) + 4;
  }
}
function instBANY(cpu: LX106Core, opcode: number) {
  const imm8 = (opcode >> 16) & 255;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  if (cpu.AR(s) & cpu.AR(t)) {
    cpu.nextPC = cpu.PC + signExtend8(imm8) + 4;
  }
}
function instBBC(cpu: LX106Core, opcode: number) {
  const imm8 = (opcode >> 16) & 255;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  const bit = cpu.AR(t) & 0x1f;
  if (!(cpu.AR(s) & (1 << bit))) {
    cpu.nextPC = cpu.PC + signExtend8(imm8) + 4;
  }
}
function instBBCI(cpu: LX106Core, opcode: number) {
  const imm8 = (opcode >> 16) & 255;
  const bbi4 = (opcode >> 12) & 1;
  const s = (opcode >> 8) & 15;
  const bbi30 = (opcode >> 4) & 15;
  const bbi = (bbi4 << 4) | bbi30;
  if (!(cpu.AR(s) & (1 << bbi))) {
    cpu.nextPC = cpu.PC + signExtend8(imm8) + 4;
  }
}
function instBBS(cpu: LX106Core, opcode: number) {
  const imm8 = (opcode >> 16) & 255;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  const bit = cpu.AR(t) & 0x1f;
  if (cpu.AR(s) & (1 << bit)) {
    cpu.nextPC = cpu.PC + signExtend8(imm8) + 4;
  }
}
function instBBSI(cpu: LX106Core, opcode: number) {
  const imm8 = (opcode >> 16) & 255;
  const bbi4 = (opcode >> 12) & 1;
  const s = (opcode >> 8) & 15;
  const bbi30 = (opcode >> 4) & 15;
  const bbi = (bbi4 << 4) | bbi30;
  if (cpu.AR(s) & (1 << bbi)) {
    cpu.nextPC = cpu.PC + signExtend8(imm8) + 4;
  }
}
function instBEQ(cpu: LX106Core, opcode: number) {
  const imm8 = (opcode >> 16) & 255;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  if (cpu.AR(s) === cpu.AR(t)) {
    cpu.nextPC = cpu.PC + signExtend8(imm8) + 4;
  }
}
function instBEQI(cpu: LX106Core, opcode: number) {
  const imm8 = (opcode >> 16) & 255;
  const r = (opcode >> 12) & 15;
  const s = (opcode >> 8) & 15;
  if ((cpu.AR(s) | 0) === B4CONST[r]) {
    cpu.nextPC = cpu.PC + signExtend8(imm8) + 4;
  }
}
function instBEQZ(cpu: LX106Core, opcode: number) {
  const imm12 = (opcode >> 12) & 4095;
  const s = (opcode >> 8) & 15;
  if (!cpu.AR(s)) {
    cpu.nextPC = cpu.PC + signExtend12(imm12) + 4;
  }
}
function instBEQZ_N(cpu: LX106Core, opcode: number) {
  const imm630 = (opcode >> 12) & 15;
  const s = (opcode >> 8) & 15;
  const imm654 = (opcode >> 4) & 3;
  const imm6 = (imm654 << 4) | imm630;
  if (!cpu.AR(s)) {
    cpu.nextPC = cpu.PC + imm6 + 4;
  }
}
function instBF(cpu: LX106Core, opcode: number) {
  const imm8 = (opcode >> 16) & 255;
  const s = (opcode >> 8) & 15;
  if (!cpu.BR(s)) {
    cpu.nextPC = cpu.PC + signExtend8(imm8) + 4;
  }
}
function instBGE(cpu: LX106Core, opcode: number) {
  const imm8 = (opcode >> 16) & 255;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  if ((cpu.AR(s) | 0) >= (cpu.AR(t) | 0)) {
    cpu.nextPC = cpu.PC + signExtend8(imm8) + 4;
  }
}
function instBGEI(cpu: LX106Core, opcode: number) {
  const imm8 = (opcode >> 16) & 255;
  const r = (opcode >> 12) & 15;
  const s = (opcode >> 8) & 15;
  if ((cpu.AR(s) | 0) >= B4CONST[r]) {
    cpu.nextPC = cpu.PC + signExtend8(imm8) + 4;
  }
}
function instBGEU(cpu: LX106Core, opcode: number) {
  const imm8 = (opcode >> 16) & 255;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  if (cpu.AR(s) >= cpu.AR(t)) {
    cpu.nextPC = cpu.PC + signExtend8(imm8) + 4;
  }
}
function instBGEUI(cpu: LX106Core, opcode: number) {
  const imm8 = (opcode >> 16) & 255;
  const r = (opcode >> 12) & 15;
  const s = (opcode >> 8) & 15;
  if (cpu.AR(s) >= B4CONSTU[r]) {
    cpu.nextPC = cpu.PC + signExtend8(imm8) + 4;
  }
}
function instBGEZ(cpu: LX106Core, opcode: number) {
  const imm12 = (opcode >> 12) & 4095;
  const s = (opcode >> 8) & 15;
  if (!(cpu.AR(s) & 0x80000000)) {
    cpu.nextPC = cpu.PC + signExtend12(imm12) + 4;
  }
}
function instBLT(cpu: LX106Core, opcode: number) {
  const imm8 = (opcode >> 16) & 255;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  if ((cpu.AR(s) | 0) < (cpu.AR(t) | 0)) {
    cpu.nextPC = cpu.PC + signExtend8(imm8) + 4;
  }
}
function instBLTI(cpu: LX106Core, opcode: number) {
  const imm8 = (opcode >> 16) & 255;
  const r = (opcode >> 12) & 15;
  const s = (opcode >> 8) & 15;
  if ((cpu.AR(s) | 0) < B4CONST[r]) {
    cpu.nextPC = cpu.PC + signExtend8(imm8) + 4;
  }
}
function instBLTU(cpu: LX106Core, opcode: number) {
  const imm8 = (opcode >> 16) & 255;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  if (cpu.AR(s) < cpu.AR(t)) {
    cpu.nextPC = cpu.PC + signExtend8(imm8) + 4;
  }
}
function instBLTUI(cpu: LX106Core, opcode: number) {
  const imm8 = (opcode >> 16) & 255;
  const r = (opcode >> 12) & 15;
  const s = (opcode >> 8) & 15;
  if (cpu.AR(s) < B4CONSTU[r]) {
    cpu.nextPC = cpu.PC + signExtend8(imm8) + 4;
  }
}
function instBLTZ(cpu: LX106Core, opcode: number) {
  const imm12 = (opcode >> 12) & 4095;
  const s = (opcode >> 8) & 15;
  if (cpu.AR(s) & 0x80000000) {
    cpu.nextPC = cpu.PC + signExtend12(imm12) + 4;
  }
}
function instBNALL(cpu: LX106Core, opcode: number) {
  const imm8 = (opcode >> 16) & 255;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  if (~cpu.AR(s) & cpu.AR(t)) {
    cpu.nextPC = cpu.PC + signExtend8(imm8) + 4;
  }
}
function instBNE(cpu: LX106Core, opcode: number) {
  const imm8 = (opcode >> 16) & 255;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  if (cpu.AR(s) != cpu.AR(t)) {
    cpu.nextPC = cpu.PC + signExtend8(imm8) + 4;
  }
}
function instBNEI(cpu: LX106Core, opcode: number) {
  const imm8 = (opcode >> 16) & 255;
  const r = (opcode >> 12) & 15;
  const s = (opcode >> 8) & 15;
  if ((cpu.AR(s) | 0) !== B4CONST[r]) {
    cpu.nextPC = cpu.PC + signExtend8(imm8) + 4;
  }
}
function instBNEZ(cpu: LX106Core, opcode: number) {
  const imm12 = (opcode >> 12) & 4095;
  const s = (opcode >> 8) & 15;
  if (cpu.AR(s) !== 0) {
    cpu.nextPC = cpu.PC + signExtend12(imm12) + 4;
  }
}
function instBNEZ_N(cpu: LX106Core, opcode: number) {
  const imm630 = (opcode >> 12) & 15;
  const s = (opcode >> 8) & 15;
  const imm654 = (opcode >> 4) & 3;
  const imm6 = (imm654 << 4) | imm630;
  if (cpu.AR(s) !== 0) {
    cpu.nextPC = cpu.PC + imm6 + 4;
  }
}
function instBNONE(cpu: LX106Core, opcode: number) {
  const imm8 = (opcode >> 16) & 255;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  if (!(cpu.AR(s) & cpu.AR(t))) {
    cpu.nextPC = cpu.PC + signExtend8(imm8) + 4;
  }
}
function instBREAK(cpu: LX106Core, opcode: number) {
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  cpu.specialRegisters[DEBUGCAUSE] = 0b001000;
  cpu.break();
}
function instBREAK_N(cpu: LX106Core, opcode: number) {
  const s = (opcode >> 8) & 15;
  cpu.specialRegisters[DEBUGCAUSE] = 0b010000;
  cpu.break();
}
function instBT(cpu: LX106Core, opcode: number) {
  const imm8 = (opcode >> 16) & 255;
  const s = (opcode >> 8) & 15;
  if (cpu.BR(s)) {
    cpu.nextPC = cpu.PC + signExtend8(imm8) + 4;
  }
}
function instCALL0(cpu: LX106Core, opcode: number) {
  const offset = (opcode >> 6) & 262143;
  const target = ((cpu.PC >>> 2) + signExtend18(offset) + 1) << 2;
  cpu.setAR(0, cpu.nextPC);
  cpu.nextPC = target;
}
function instCALLX0(cpu: LX106Core, opcode: number) {
  const s = (opcode >> 8) & 15;
  const { nextPC } = cpu;
  cpu.nextPC = cpu.AR(s);
  cpu.setAR(0, nextPC);
}
function instCLAMPS(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instDHI(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instDHU(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instDHWB(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instDHWBI(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instDII(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instDIU(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instDIWB(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instDIWBI(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instDPFL(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instDPFR(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instDPFRO(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instDPFW(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instDPFWO(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instDSYNC(cpu: LX106Core, opcode: number) {
  // dsync()
}
function instESYNC(cpu: LX106Core, opcode: number) {
  // esync()
}
function instEXCW(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instEXTUI(cpu: LX106Core, opcode: number) {
  const op2 = (opcode >> 20) & 15;
  const sa4 = (opcode >> 16) & 1;
  const r = (opcode >> 12) & 15;
  const sae30 = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  const sa = (sa4 << 4) | sae30;
  const mask = (1 << (op2 + 1)) - 1;
  cpu.setAR(r, (cpu.AR(t) >> sa) & mask);
}
function instEXTW(cpu: LX106Core, opcode: number) {
  // extw()
}
function instIDTLB(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instIHI(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instIHU(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instIII(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instIITLB(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instIIU(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instILL(cpu: LX106Core, opcode: number) {
  cpu.exception(ExceptionCause.IllegalInstruction);
}
function instILL_N(cpu: LX106Core, opcode: number) {
  cpu.exception(ExceptionCause.IllegalInstruction);
}
function instIPF(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instIPFL(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instISYNC(cpu: LX106Core, opcode: number) {
  // isync()
}
function instJ(cpu: LX106Core, opcode: number) {
  const offset = (opcode >> 6) & 262143;
  cpu.nextPC = cpu.PC + signExtend18(offset) + 4;
}
function instJX(cpu: LX106Core, opcode: number) {
  const s = (opcode >> 8) & 15;
  cpu.nextPC = cpu.AR(s);
}
function instL8UI(cpu: LX106Core, opcode: number) {
  const imm8 = (opcode >> 16) & 255;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  cpu.setAR(t, cpu.readUint8(cpu.AR(s) + imm8));
}
function instL16SI(cpu: LX106Core, opcode: number) {
  const imm8 = (opcode >> 16) & 255;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  cpu.setAR(t, signExtend16(cpu.readUint16(cpu.AR(s) + (imm8 << 1))));
}
function instL16UI(cpu: LX106Core, opcode: number) {
  const imm8 = (opcode >> 16) & 255;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  cpu.setAR(t, cpu.readUint16(cpu.AR(s) + (imm8 << 1)));
}
function instL32AI(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instL32I(cpu: LX106Core, opcode: number) {
  const imm8 = (opcode >> 16) & 255;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  cpu.setAR(t, cpu.readUint32(cpu.AR(s) + (imm8 << 2)));
}
function instL32I_N(cpu: LX106Core, opcode: number) {
  const imm4 = (opcode >> 12) & 15;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  cpu.setAR(t, cpu.readUint32(cpu.AR(s) + (imm4 << 2)));
}
function instL32R(cpu: LX106Core, opcode: number) {
  const imm16 = (opcode >> 8) & 65535;
  const t = (opcode >> 4) & 15;
  cpu.setAR(t, cpu.readUint32(((cpu.nextPC >>> 2) + (0xffff0000 | imm16)) << 2));
}
function instLDCT(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instLDDEC(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instLDINC(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instLICT(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instLICW(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instMAX(cpu: LX106Core, opcode: number) {
  const r = (opcode >> 12) & 15;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  const op1 = cpu.AR(s) | 0;
  const op2 = cpu.AR(t) | 0;
  cpu.setAR(r, op1 > op2 ? op1 : op2);
}
function instMAXU(cpu: LX106Core, opcode: number) {
  const r = (opcode >> 12) & 15;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  const op1 = cpu.AR(s);
  const op2 = cpu.AR(t);
  cpu.setAR(r, op1 > op2 ? op1 : op2);
}
function instMEMW(cpu: LX106Core, opcode: number) {}
function instMIN(cpu: LX106Core, opcode: number) {
  const r = (opcode >> 12) & 15;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  const op1 = cpu.AR(s) | 0;
  const op2 = cpu.AR(t) | 0;
  cpu.setAR(r, op1 < op2 ? op1 : op2);
}
function instMINU(cpu: LX106Core, opcode: number) {
  const r = (opcode >> 12) & 15;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  const op1 = cpu.AR(s);
  const op2 = cpu.AR(t);
  cpu.setAR(r, op1 < op2 ? op1 : op2);
}
function instMOV_N(cpu: LX106Core, opcode: number) {
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  cpu.setAR(t, cpu.AR(s));
}
function instMOVEQZ(cpu: LX106Core, opcode: number) {
  const r = (opcode >> 12) & 15;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  if (!cpu.AR(t)) {
    cpu.setAR(r, cpu.AR(s));
  }
}
function instMOVF(cpu: LX106Core, opcode: number) {
  const r = (opcode >> 12) & 15;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  if (!cpu.BR(t)) {
    cpu.setAR(r, cpu.AR(s));
  }
}
function instMOVGEZ(cpu: LX106Core, opcode: number) {
  const r = (opcode >> 12) & 15;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  if (!(cpu.AR(t) & 0x80000000)) {
    cpu.setAR(r, cpu.AR(s));
  }
}
function instMOVI(cpu: LX106Core, opcode: number) {
  const imm12b70 = (opcode >> 16) & 255;
  const imm12b118 = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  cpu.setAR(t, signExtend12((imm12b118 << 8) | imm12b70));
}
function instMOVI_N(cpu: LX106Core, opcode: number) {
  const imm730 = (opcode >> 12) & 15;
  const s = (opcode >> 8) & 15;
  const imm764 = (opcode >> 4) & 7;
  const imm7 = (imm764 << 4) | imm730;
  cpu.setAR(s, imm7 | ((imm7 & 0x60) === 0x60 ? 0xffffff80 : 0));
}
function instMOVLTZ(cpu: LX106Core, opcode: number) {
  const r = (opcode >> 12) & 15;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  if (cpu.AR(t) & 0x80000000) {
    cpu.setAR(r, cpu.AR(s));
  }
}
function instMOVNEZ(cpu: LX106Core, opcode: number) {
  const r = (opcode >> 12) & 15;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  if (cpu.AR(t)) {
    cpu.setAR(r, cpu.AR(s));
  }
}
function instMOVT(cpu: LX106Core, opcode: number) {
  const r = (opcode >> 12) & 15;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  if (cpu.BR(t)) {
    cpu.setAR(r, cpu.AR(s));
  }
}
function instMUL_AA_$(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instMUL_AD_$(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instMUL_DA_$(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instMUL_DD_$(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instMUL16S(cpu: LX106Core, opcode: number) {
  const r = (opcode >> 12) & 15;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  cpu.setAR(r, signExtend16(cpu.AR(s) & 0xffff) * signExtend16(cpu.AR(t) & 0xffff));
}
function instMUL16U(cpu: LX106Core, opcode: number) {
  const r = (opcode >> 12) & 15;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  cpu.setAR(r, (cpu.AR(s) & 0xffff) * (cpu.AR(t) & 0xffff));
}
function instMULA_AA_$(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instMULA_AD_$(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instMULA_DA_$(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instMULA_DA_$_LDDEC(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instMULA_DA_$_LDINC(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instMULA_DD_$(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instMULA_DD_$_LDDEC(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instMULA_DD_$_LDINC(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instMULL(cpu: LX106Core, opcode: number) {
  const r = (opcode >> 12) & 15;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  cpu.setAR(r, Math.imul(cpu.AR(s), cpu.AR(t)));
}
function instMULS_AA_$(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instMULS_AD_$(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instMULS_DA_$(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instMULS_DD_$(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instMULSH(cpu: LX106Core, opcode: number) {
  const r = (opcode >> 12) & 15;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  const a = cpu.AR(s) | 0;
  const b = cpu.AR(t) | 0;
  const absA = a >= 0 ? a : -a;
  const absB = b >= 0 ? b : -b;
  const ah = absA >>> 16;
  const bh = absB >>> 16;
  if (!ah && !bh) {
    cpu.setAR(r, a * b < 0 ? 0xffffffff : 0);
  } else {
    const al = absA & 0xffff;
    const bl = absB & 0xffff;
    const mid = ah * bl + al * bh;
    const albl = al * bl;
    const imm = mid + (albl >>> 16);
    const carry = imm > 0xffffffff ? 0x10000 : 0;
    let result = ah * bh + (imm >>> 16) + carry;
    if (a < 0 ? b > 0 : b < 0) {
      result = ~result;
    }
    cpu.setAR(r, result);
  }
}
function instMULUH(cpu: LX106Core, opcode: number) {
  const r = (opcode >> 12) & 15;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  const a = cpu.AR(s);
  const b = cpu.AR(t);
  const ah = a >>> 16;
  const bh = b >>> 16;
  const al = a & 0xffff;
  const bl = b & 0xffff;
  const mid = ah * bl + al * bh;
  const albl = al * bl;
  const imm = mid + (albl >>> 16);
  const carry = imm > 0xffffffff ? 0x10000 : 0;
  cpu.setAR(r, ah * bh + (imm >>> 16) + carry);
}
function instNEG(cpu: LX106Core, opcode: number) {
  const r = (opcode >> 12) & 15;
  const t = (opcode >> 4) & 15;
  cpu.setAR(r, ~cpu.AR(t) + 1);
}
function instNOP(cpu: LX106Core, opcode: number) {
  // none
}
function instNOP_N(cpu: LX106Core, opcode: number) {
  // none
}
function instNSA(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instNSAU(cpu: LX106Core, opcode: number) {
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  const input = cpu.AR(s);
  if (!input) {
    cpu.setAR(t, 32);
  } else {
    const b4 = (input & 0xffff0000) === 0 ? 16 : 0;
    const t3 = b4 ? input & 0xffff : (input >>> 16) & 0xffff;
    const b3 = (t3 & 0xff00) === 0 ? 8 : 0;
    const t2 = b3 ? t3 & 0xff : (t3 >>> 8) & 0xff;
    const b2 = (t2 & 0xf0) === 0 ? 4 : 0;
    const t1 = b2 ? t2 & 0xf : (t2 >>> 4) & 0xf;
    const b1 = (t1 & 0xc) === 0 ? 2 : 0;
    const t0 = b1 ? t1 & 0x2 : t1 & 0x8;
    const b0 = t0 === 0 ? 1 : 0;
    cpu.setAR(t, b4 | b3 | b2 | b1 | b0);
  }
}
function instOR(cpu: LX106Core, opcode: number) {
  const r = (opcode >> 12) & 15;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  cpu.setAR(r, cpu.AR(s) | cpu.AR(t));
}
function instORB(cpu: LX106Core, opcode: number) {
  const r = (opcode >> 12) & 15;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  cpu.setBR(r, cpu.BR(s) || cpu.BR(t));
}
function instORBC(cpu: LX106Core, opcode: number) {
  const r = (opcode >> 12) & 15;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  cpu.setBR(r, cpu.BR(s) || !cpu.BR(t));
}
function instPDTLB(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instPITLB(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instQUOS(cpu: LX106Core, opcode: number) {
  const r = (opcode >> 12) & 15;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  const divider = cpu.AR(t) | 0;
  if (!divider) {
    cpu.exception(ExceptionCause.IntegerDivideByZero);
  } else {
    cpu.setAR(r, (cpu.AR(s) | 0) / divider);
  }
}
function instQUOU(cpu: LX106Core, opcode: number) {
  const r = (opcode >> 12) & 15;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  const divider = cpu.AR(t);
  if (!divider) {
    cpu.exception(ExceptionCause.IntegerDivideByZero);
  } else {
    cpu.setAR(r, cpu.AR(s) / divider);
  }
}
function instRDTLB0(cpu: LX106Core, opcode: number) {
  // cpu.unimplemented(opcode);
}
function instRDTLB1(cpu: LX106Core, opcode: number) {
  // cpu.unimplemented(opcode);
}
function instREMS(cpu: LX106Core, opcode: number) {
  const r = (opcode >> 12) & 15;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  const divisor = cpu.AR(t) | 0;
  if (!divisor) {
    cpu.exception(ExceptionCause.IntegerDivideByZero);
  } else {
    cpu.setAR(r, (cpu.AR(s) | 0) % divisor);
  }
}
function instREMU(cpu: LX106Core, opcode: number) {
  const r = (opcode >> 12) & 15;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  const divisor = cpu.AR(t);
  if (!divisor) {
    cpu.exception(ExceptionCause.IntegerDivideByZero);
  } else {
    cpu.setAR(r, cpu.AR(s) % divisor);
  }
}
function instRER(cpu: LX106Core, opcode: number) {
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  if (cpu.PS_CRING) {
    cpu.exception(ExceptionCause.Privileged);
  } else {
    cpu.setAR(t, 0);
  }
}
function instRET(cpu: LX106Core, opcode: number) {
  cpu.nextPC = cpu.AR(0);
}
function instRFDD(cpu: LX106Core, opcode: number) {
  const s0 = (opcode >> 8) & 1;
  cpu.unimplemented(opcode);
  //
}
function instRFDE(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instRFDO(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instRFE(cpu: LX106Core, opcode: number) {
  if (cpu.PS_CRING) {
    cpu.exception(ExceptionCause.Privileged);
  } else {
    cpu.PS_EXCM = 0;
    cpu.nextPC = cpu.specialRegisters[EPC1];
  }
}
function instRFI(cpu: LX106Core, opcode: number) {
  const level = (opcode >> 8) & 15;
  if (cpu.PS_CRING) {
    cpu.exception(ExceptionCause.Privileged);
  } else {
    cpu.nextPC = cpu.specialRegisters[EPC2 + level - 2];
    cpu.specialRegisters[PS] = cpu.specialRegisters[EPS2 + level - 2];
  }
}
function instRFME(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instRFUE(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instRITLB0(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instRITLB1(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instRSIL(cpu: LX106Core, opcode: number) {
  const imm4 = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  if (cpu.PS_CRING) {
    cpu.exception(ExceptionCause.Privileged);
  } else {
    cpu.setAR(t, cpu.specialRegisters[PS]);
    cpu.PS_INTLEVEL = imm4;
  }
}
function instRSR_$(cpu: LX106Core, opcode: number) {
  const sr = (opcode >> 8) & 255;
  const t = (opcode >> 4) & 15;
  if (sr >= 64 && cpu.PS_CRING) {
    cpu.exception(ExceptionCause.Privileged);
  } else {
    cpu.setAR(t, cpu.readSpecialRegister(sr));
  }
}
function instRSYNC(cpu: LX106Core, opcode: number) {
  // rsync()
}
function instRUR_$(cpu: LX106Core, opcode: number) {
  const r = (opcode >> 12) & 15;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  cpu.setAR(r, cpu.userRegisters[(s << 4) | t]);
}
function instS8I(cpu: LX106Core, opcode: number) {
  const imm8 = (opcode >> 16) & 255;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  const vAddr = cpu.AR(s) + imm8;
  cpu.writeUint8(vAddr, cpu.AR(t));
}
function instS16I(cpu: LX106Core, opcode: number) {
  const imm8 = (opcode >> 16) & 255;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  const vAddr = cpu.AR(s) + (imm8 << 1);
  cpu.writeUint16(vAddr, cpu.AR(t));
}
function instS32C1I(cpu: LX106Core, opcode: number) {
  const imm8 = (opcode >> 16) & 255;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  const vAddr = cpu.AR(s) + (imm8 << 2);
  const value = cpu.readUint32(vAddr);
  if (value === cpu.specialRegisters[SCOMPARE1]) {
    cpu.writeUint32(vAddr, cpu.AR(t));
  }
  cpu.setAR(t, value);
}
function instS32I(cpu: LX106Core, opcode: number) {
  const imm8 = (opcode >> 16) & 255;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  const vAddr = cpu.AR(s) + (imm8 << 2);
  cpu.writeUint32(vAddr, cpu.AR(t));
}
function instS32I_N(cpu: LX106Core, opcode: number) {
  const imm4 = (opcode >> 12) & 15;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  cpu.writeUint32(cpu.AR(s) + (imm4 << 2), cpu.AR(t));
}
function instS32RI(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instSDCT(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instSEXT(cpu: LX106Core, opcode: number) {
  const r = (opcode >> 12) & 15;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  const b = t + 7;
  const input = cpu.AR(s);
  cpu.setAR(r, input & (1 << b) ? input | (0xffffffff << b) : input & ~(0xffffffff << b));
}
function instSICT(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instSICW(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instSIMCALL(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
  // See the Xtensa Instruction Set Simulator (ISS) User's Guide.
}
function instSLL(cpu: LX106Core, opcode: number) {
  const r = (opcode >> 12) & 15;
  const s = (opcode >> 8) & 15;
  cpu.setAR(r, cpu.AR(s) << (32 - (cpu.SAR & 0x3f)));
}
function instSLLI(cpu: LX106Core, opcode: number) {
  const sa4 = (opcode >> 20) & 1;
  const r = (opcode >> 12) & 15;
  const s = (opcode >> 8) & 15;
  const sa30 = (opcode >> 4) & 15;
  const sa = (sa4 << 4) | sa30;
  cpu.setAR(r, cpu.AR(s) << (32 - sa));
}
function instSRA(cpu: LX106Core, opcode: number) {
  const r = (opcode >> 12) & 15;
  const t = (opcode >> 4) & 15;
  cpu.setAR(r, cpu.AR(t) >> (cpu.SAR & 0x3f));
}
function instSRAI(cpu: LX106Core, opcode: number) {
  const sa4 = (opcode >> 20) & 1;
  const r = (opcode >> 12) & 15;
  const sa30 = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  const sa = (sa4 << 4) | sa30;
  cpu.setAR(r, cpu.AR(t) >> sa);
}
function instSRC(cpu: LX106Core, opcode: number) {
  const r = (opcode >> 12) & 15;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  const sa = cpu.SAR;
  const high = cpu.AR(s);
  const low = cpu.AR(t);
  if (sa === 0) {
    cpu.setAR(r, low);
  } else if (sa === 32) {
    cpu.setAR(r, high);
  } else {
    cpu.setAR(r, ((high << (32 - sa)) | (low >>> sa)) & 0xffffffff);
  }
}
function instSRL(cpu: LX106Core, opcode: number) {
  const r = (opcode >> 12) & 15;
  const t = (opcode >> 4) & 15;
  cpu.setAR(r, cpu.AR(t) >>> (cpu.SAR & 0x3f));
}
function instSRLI(cpu: LX106Core, opcode: number) {
  const r = (opcode >> 12) & 15;
  const sa = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  cpu.setAR(r, cpu.AR(t) >>> sa);
}
function instSSA8B(cpu: LX106Core, opcode: number) {
  const s = (opcode >> 8) & 15;
  cpu.SAR = 32 - ((cpu.AR(s) & 0x3) << 3);
}
function instSSA8L(cpu: LX106Core, opcode: number) {
  const s = (opcode >> 8) & 15;
  cpu.SAR = (cpu.AR(s) & 0x3) << 3;
}
function instSSAI(cpu: LX106Core, opcode: number) {
  const sa30 = (opcode >> 8) & 15;
  const sa4 = (opcode >> 4) & 1;
  cpu.SAR = (sa4 << 4) | sa30;
}
function instSSL(cpu: LX106Core, opcode: number) {
  const s = (opcode >> 8) & 15;
  cpu.SAR = 32 - (cpu.AR(s) & 0x1f);
}
function instSSR(cpu: LX106Core, opcode: number) {
  const s = (opcode >> 8) & 15;
  cpu.SAR = cpu.AR(s) & 0x1f;
}
function instSUB(cpu: LX106Core, opcode: number) {
  const r = (opcode >> 12) & 15;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  cpu.setAR(r, cpu.AR(s) - cpu.AR(t));
}
function instSUBX2(cpu: LX106Core, opcode: number) {
  const r = (opcode >> 12) & 15;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  cpu.setAR(r, (cpu.AR(s) << 1) - cpu.AR(t));
}
function instSUBX4(cpu: LX106Core, opcode: number) {
  const r = (opcode >> 12) & 15;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  cpu.setAR(r, (cpu.AR(s) << 2) - cpu.AR(t));
}
function instSUBX8(cpu: LX106Core, opcode: number) {
  const r = (opcode >> 12) & 15;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  cpu.setAR(r, (cpu.AR(s) << 3) - cpu.AR(t));
}
function instSYSCALL(cpu: LX106Core, opcode: number) {
  cpu.exception(ExceptionCause.Syscall);
}
function instUMUL_AA_$(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode);
}
function instWAITI(cpu: LX106Core, opcode: number) {
  const imm4 = (opcode >> 8) & 15;
  if (cpu.PS_CRING) {
    cpu.exception(ExceptionCause.Privileged);
  } else {
    cpu.PS_INTLEVEL = imm4;
    cpu.idle = true;
  }
}
function instWDTLB(cpu: LX106Core, opcode: number) {
  // TODO cpu.unimplemented(opcode);
}
function instWER(cpu: LX106Core, opcode: number) {
  cpu.unimplemented(opcode, 'WER');
}
function instWITLB(cpu: LX106Core, opcode: number) {
  // TODO cpu.unimplemented(opcode);
}
function instWSR_$(cpu: LX106Core, opcode: number) {
  const sr = (opcode >> 8) & 255;
  const t = (opcode >> 4) & 15;
  if (sr >= 64 && cpu.PS_CRING) {
    cpu.exception(ExceptionCause.Privileged);
  } else {
    cpu.writeSpecialRegister(sr, cpu.AR(t));
  }
}
function instWUR_$(cpu: LX106Core, opcode: number) {
  const sr = (opcode >> 8) & 255;
  const t = (opcode >> 4) & 15;
  cpu.userRegisters[sr] = cpu.AR(t);
}
function instXOR(cpu: LX106Core, opcode: number) {
  const r = (opcode >> 12) & 15;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  cpu.setAR(r, cpu.AR(s) ^ cpu.AR(t));
}
function instXORB(cpu: LX106Core, opcode: number) {
  const r = (opcode >> 12) & 15;
  const s = (opcode >> 8) & 15;
  const t = (opcode >> 4) & 15;
  cpu.setBR(r, cpu.BR(s) ? !cpu.BR(t) : cpu.BR(t));
}
function instXSR_$(cpu: LX106Core, opcode: number) {
  const sr = (opcode >> 8) & 255;
  const t = (opcode >> 4) & 15;
  if (sr >= 64 && cpu.PS_CRING) {
    cpu.exception(ExceptionCause.Privileged);
  } else {
    const t0 = cpu.AR(t);
    const t1 = cpu.readSpecialRegister(sr);
    cpu.writeSpecialRegister(sr, t0);
    cpu.setAR(t, t1);
  }
}

export function executeInstruction(cpu: LX106Core, opcode: number) {
  switch (opcode & 0xf) {
    case 0x0:
      switch (opcode & 0xe0000) {
        case 0x0:
          switch (opcode & 0xe10000) {
            case 0x0:
              switch (opcode & 0x100000) {
                case 0x0:
                  switch (opcode & 0xf000) {
                    case 0x0:
                      switch (opcode & 0xf0) {
                        case 0x0:
                          instILL(cpu, opcode);
                          return;
                        case 0x80:
                          instRET(cpu, opcode);
                          return;
                        case 0xa0:
                          instJX(cpu, opcode);
                          return;
                        case 0xc0:
                          instCALLX0(cpu, opcode);
                          return;
                      }
                      return;
                    case 0x2000:
                      switch (opcode & 0xff0) {
                        case 0x0:
                          instISYNC(cpu, opcode);
                          return;
                        case 0x10:
                          instRSYNC(cpu, opcode);
                          return;
                        case 0x20:
                          instESYNC(cpu, opcode);
                          return;
                        case 0x30:
                          instDSYNC(cpu, opcode);
                          return;
                        case 0x80:
                          instEXCW(cpu, opcode);
                          return;
                        case 0xc0:
                          instMEMW(cpu, opcode);
                          return;
                        case 0xd0:
                          instEXTW(cpu, opcode);
                          return;
                        case 0xf0:
                          instNOP(cpu, opcode);
                          return;
                      }
                      return;
                    case 0x3000:
                      switch (opcode & 0xf0) {
                        case 0x0:
                          switch (opcode & 0xf00) {
                            case 0x0:
                              instRFE(cpu, opcode);
                              return;
                            case 0x100:
                              instRFUE(cpu, opcode);
                              return;
                            case 0x200:
                              instRFDE(cpu, opcode);
                              return;
                          }
                          return;
                        case 0x10:
                          instRFI(cpu, opcode);
                          return;
                        case 0x20:
                          instRFME(cpu, opcode);
                          return;
                      }
                      return;
                    case 0x4000:
                      instBREAK(cpu, opcode);
                      return;
                    case 0x5000:
                      if ((opcode & 0xff0) == 0x100) {
                        instSIMCALL(cpu, opcode);
                      }
                      if ((opcode & 0xff0) == 0x0) {
                        instSYSCALL(cpu, opcode);
                      }
                      return;
                    case 0x6000:
                      instRSIL(cpu, opcode);
                      return;
                    case 0x7000:
                      instWAITI(cpu, opcode);
                      return;
                    case 0x8000:
                      instANY4(cpu, opcode);
                      return;
                    case 0x9000:
                      instALL4(cpu, opcode);
                      return;
                    case 0xa000:
                      instANY8(cpu, opcode);
                      return;
                    case 0xb000:
                      instALL8(cpu, opcode);
                      return;
                  }
                  return;
                case 0x100000:
                  instAND(cpu, opcode);
                  return;
              }
              return;
            case 0x10000:
              instSLLI(cpu, opcode);
              return;
            case 0x200000:
              if ((opcode & 0x100000) == 0x0) {
                instOR(cpu, opcode);
              }
              if ((opcode & 0x100000) == 0x100000) {
                instXOR(cpu, opcode);
              }
              return;
            case 0x210000:
              instSRAI(cpu, opcode);
              return;
            case 0x400000:
              switch (opcode & 0x10f000) {
                case 0x0:
                  instSSR(cpu, opcode);
                  return;
                case 0x1000:
                  instSSL(cpu, opcode);
                  return;
                case 0x2000:
                  instSSA8L(cpu, opcode);
                  return;
                case 0x3000:
                  instSSA8B(cpu, opcode);
                  return;
                case 0x4000:
                  instSSAI(cpu, opcode);
                  return;
                case 0x6000:
                  instRER(cpu, opcode);
                  return;
                case 0x7000:
                  instWER(cpu, opcode);
                  return;
                case 0xe000:
                  instNSA(cpu, opcode);
                  return;
                case 0xf000:
                  instNSAU(cpu, opcode);
                  return;
                case 0x103000:
                  instRITLB0(cpu, opcode);
                  return;
                case 0x104000:
                  instIITLB(cpu, opcode);
                  return;
                case 0x105000:
                  instPITLB(cpu, opcode);
                  return;
                case 0x106000:
                  instWITLB(cpu, opcode);
                  return;
                case 0x107000:
                  instRITLB1(cpu, opcode);
                  return;
                case 0x10b000:
                  instRDTLB0(cpu, opcode);
                  return;
                case 0x10c000:
                  instIDTLB(cpu, opcode);
                  return;
                case 0x10d000:
                  instPDTLB(cpu, opcode);
                  return;
                case 0x10e000:
                  instWDTLB(cpu, opcode);
                  return;
                case 0x10f000:
                  instRDTLB1(cpu, opcode);
                  return;
              }
              return;
            case 0x410000:
              instSRLI(cpu, opcode);
              return;
            case 0x600000:
              if ((opcode & 0x100f00) == 0x100) {
                instABS(cpu, opcode);
              }
              if ((opcode & 0x100f00) == 0x0) {
                instNEG(cpu, opcode);
              }
              return;
            case 0x610000:
              instXSR_$(cpu, opcode);
              return;
            case 0x800000:
              if ((opcode & 0x100000) == 0x0) {
                instADD(cpu, opcode);
              }
              if ((opcode & 0x100000) == 0x100000) {
                instADDX2(cpu, opcode);
              }
              return;
            case 0x810000:
              if ((opcode & 0x100000) == 0x0) {
                instSRC(cpu, opcode);
              }
              if ((opcode & 0x100f00) == 0x100000) {
                instSRL(cpu, opcode);
              }
              return;
            case 0xa00000:
              if ((opcode & 0x100000) == 0x0) {
                instADDX4(cpu, opcode);
              }
              if ((opcode & 0x100000) == 0x100000) {
                instADDX8(cpu, opcode);
              }
              return;
            case 0xa10000:
              if ((opcode & 0x1000f0) == 0x0) {
                instSLL(cpu, opcode);
              }
              if ((opcode & 0x100f00) == 0x100000) {
                instSRA(cpu, opcode);
              }
              return;
            case 0xc00000:
              if ((opcode & 0x100000) == 0x0) {
                instSUB(cpu, opcode);
              }
              if ((opcode & 0x100000) == 0x100000) {
                instSUBX2(cpu, opcode);
              }
              return;
            case 0xc10000:
              if ((opcode & 0x100000) == 0x100000) {
                instMUL16S(cpu, opcode);
              }
              if ((opcode & 0x100000) == 0x0) {
                instMUL16U(cpu, opcode);
              }
              return;
            case 0xe00000:
              if ((opcode & 0x100000) == 0x0) {
                instSUBX4(cpu, opcode);
              }
              if ((opcode & 0x100000) == 0x100000) {
                instSUBX8(cpu, opcode);
              }
              return;
            case 0xe10000:
              switch (opcode & 0x10f000) {
                case 0x100000:
                  instLICT(cpu, opcode);
                  return;
                case 0x101000:
                  instSICT(cpu, opcode);
                  return;
                case 0x102000:
                  instLICW(cpu, opcode);
                  return;
                case 0x103000:
                  instSICW(cpu, opcode);
                  return;
                case 0x108000:
                  instLDCT(cpu, opcode);
                  return;
                case 0x109000:
                  instSDCT(cpu, opcode);
                  return;
                case 0x10e000:
                  if ((opcode & 0xef0) == 0x10) {
                    instRFDD(cpu, opcode);
                  }
                  if ((opcode & 0xff0) == 0x0) {
                    instRFDO(cpu, opcode);
                  }
                  return;
              }
              return;
          }
          return;
        case 0x20000:
          switch (opcode & 0xf10000) {
            case 0x0:
              instANDB(cpu, opcode);
              return;
            case 0x10000:
              instRSR_$(cpu, opcode);
              return;
            case 0x100000:
              instANDBC(cpu, opcode);
              return;
            case 0x110000:
              instWSR_$(cpu, opcode);
              return;
            case 0x200000:
              instORB(cpu, opcode);
              return;
            case 0x210000:
              instSEXT(cpu, opcode);
              return;
            case 0x300000:
              instORBC(cpu, opcode);
              return;
            case 0x310000:
              instCLAMPS(cpu, opcode);
              return;
            case 0x400000:
              instXORB(cpu, opcode);
              return;
            case 0x410000:
              instMIN(cpu, opcode);
              return;
            case 0x510000:
              instMAX(cpu, opcode);
              return;
            case 0x610000:
              instMINU(cpu, opcode);
              return;
            case 0x710000:
              instMAXU(cpu, opcode);
              return;
            case 0x800000:
              instMULL(cpu, opcode);
              return;
            case 0x810000:
              instMOVEQZ(cpu, opcode);
              return;
            case 0x910000:
              instMOVNEZ(cpu, opcode);
              return;
            case 0xa00000:
              instMULUH(cpu, opcode);
              return;
            case 0xa10000:
              instMOVLTZ(cpu, opcode);
              return;
            case 0xb00000:
              instMULSH(cpu, opcode);
              return;
            case 0xb10000:
              instMOVGEZ(cpu, opcode);
              return;
            case 0xc00000:
              instQUOU(cpu, opcode);
              return;
            case 0xc10000:
              instMOVF(cpu, opcode);
              return;
            case 0xd00000:
              instQUOS(cpu, opcode);
              return;
            case 0xd10000:
              instMOVT(cpu, opcode);
              return;
            case 0xe00000:
              instREMU(cpu, opcode);
              return;
            case 0xe10000:
              instRUR_$(cpu, opcode);
              return;
            case 0xf00000:
              instREMS(cpu, opcode);
              return;
            case 0xf10000:
              instWUR_$(cpu, opcode);
              return;
          }
          return;
        case 0x40000:
          instEXTUI(cpu, opcode);
          return;
      }
      return;
    case 0x1:
      instL32R(cpu, opcode);
      return;
    case 0x2:
      switch (opcode & 0xf000) {
        case 0x0:
          instL8UI(cpu, opcode);
          return;
        case 0x1000:
          instL16UI(cpu, opcode);
          return;
        case 0x2000:
          instL32I(cpu, opcode);
          return;
        case 0x4000:
          instS8I(cpu, opcode);
          return;
        case 0x5000:
          instS16I(cpu, opcode);
          return;
        case 0x6000:
          instS32I(cpu, opcode);
          return;
        case 0x7000:
          switch (opcode & 0xf0) {
            case 0x0:
              instDPFR(cpu, opcode);
              return;
            case 0x10:
              instDPFW(cpu, opcode);
              return;
            case 0x20:
              instDPFRO(cpu, opcode);
              return;
            case 0x30:
              instDPFWO(cpu, opcode);
              return;
            case 0x40:
              instDHWB(cpu, opcode);
              return;
            case 0x50:
              instDHWBI(cpu, opcode);
              return;
            case 0x60:
              instDHI(cpu, opcode);
              return;
            case 0x70:
              instDII(cpu, opcode);
              return;
            case 0x80:
              switch (opcode & 0xf0000) {
                case 0x0:
                  instDPFL(cpu, opcode);
                  return;
                case 0x20000:
                  instDHU(cpu, opcode);
                  return;
                case 0x30000:
                  instDIU(cpu, opcode);
                  return;
                case 0x40000:
                  instDIWB(cpu, opcode);
                  return;
                case 0x50000:
                  instDIWBI(cpu, opcode);
                  return;
              }
              return;
            case 0xc0:
              instIPF(cpu, opcode);
              return;
            case 0xd0:
              switch (opcode & 0xf0000) {
                case 0x0:
                  instIPFL(cpu, opcode);
                  return;
                case 0x20000:
                  instIHU(cpu, opcode);
                  return;
                case 0x30000:
                  instIIU(cpu, opcode);
                  return;
              }
              return;
            case 0xe0:
              instIHI(cpu, opcode);
              return;
            case 0xf0:
              instIII(cpu, opcode);
              return;
          }
          return;
        case 0x9000:
          instL16SI(cpu, opcode);
          return;
        case 0xa000:
          instMOVI(cpu, opcode);
          return;
        case 0xb000:
          instL32AI(cpu, opcode);
          return;
        case 0xc000:
          instADDI(cpu, opcode);
          return;
        case 0xd000:
          instADDMI(cpu, opcode);
          return;
        case 0xe000:
          instS32C1I(cpu, opcode);
          return;
        case 0xf000:
          instS32RI(cpu, opcode);
          return;
      }
      return;
    case 0x4:
      switch (opcode & 0xfc8000) {
        case 0x80000:
          instMULA_DD_$_LDINC(cpu, opcode);
          return;
        case 0x180000:
          instMULA_DD_$_LDDEC(cpu, opcode);
          return;
        case 0x240000:
          instMUL_DD_$(cpu, opcode);
          return;
        case 0x280000:
          instMULA_DD_$(cpu, opcode);
          return;
        case 0x2c0000:
          instMULS_DD_$(cpu, opcode);
          return;
        case 0x340000:
          instMUL_AD_$(cpu, opcode);
          return;
        case 0x380000:
          instMULA_AD_$(cpu, opcode);
          return;
        case 0x3c0000:
          instMULS_AD_$(cpu, opcode);
          return;
        case 0x480000:
          instMULA_DA_$_LDINC(cpu, opcode);
          return;
        case 0x580000:
          instMULA_DA_$_LDDEC(cpu, opcode);
          return;
        case 0x640000:
          instMUL_DA_$(cpu, opcode);
          return;
        case 0x680000:
          instMULA_DA_$(cpu, opcode);
          return;
        case 0x6c0000:
          instMULS_DA_$(cpu, opcode);
          return;
        case 0x700000:
          instUMUL_AA_$(cpu, opcode);
          return;
        case 0x740000:
          instMUL_AA_$(cpu, opcode);
          return;
        case 0x780000:
          instMULA_AA_$(cpu, opcode);
          return;
        case 0x7c0000:
          instMULS_AA_$(cpu, opcode);
          return;
        case 0x800000:
          instLDINC(cpu, opcode);
          return;
        case 0x900000:
          instLDDEC(cpu, opcode);
          return;
      }
      return;
    case 0x5:
      switch (opcode & 0x30) {
        case 0x0:
          instCALL0(cpu, opcode);
          return;
      }
      return;
    case 0x6:
      switch (opcode & 0x30) {
        case 0x0:
          instJ(cpu, opcode);
          return;
        case 0x10:
          switch (opcode & 0xc0) {
            case 0x0:
              instBEQZ(cpu, opcode);
              return;
            case 0x40:
              instBNEZ(cpu, opcode);
              return;
            case 0x80:
              instBLTZ(cpu, opcode);
              return;
            case 0xc0:
              instBGEZ(cpu, opcode);
              return;
          }
          return;
        case 0x20:
          switch (opcode & 0xc0) {
            case 0x0:
              instBEQI(cpu, opcode);
              return;
            case 0x40:
              instBNEI(cpu, opcode);
              return;
            case 0x80:
              instBLTI(cpu, opcode);
              return;
            case 0xc0:
              instBGEI(cpu, opcode);
              return;
          }
          return;
        case 0x30:
          switch (opcode & 0xc0) {
            case 0x40:
              switch (opcode & 0xf000) {
                case 0x0:
                  instBF(cpu, opcode);
                  return;
                case 0x1000:
                  instBT(cpu, opcode);
                  return;
              }
              return;
            case 0x80:
              instBLTUI(cpu, opcode);
              return;
            case 0xc0:
              instBGEUI(cpu, opcode);
              return;
          }
          return;
      }
      return;
    case 0x7:
      switch (opcode & 0xe000) {
        case 0x0:
          if ((opcode & 0x1000) == 0x1000) {
            instBEQ(cpu, opcode);
          }
          if ((opcode & 0x1000) == 0x0) {
            instBNONE(cpu, opcode);
          }
          return;
        case 0x2000:
          if ((opcode & 0x1000) == 0x0) {
            instBLT(cpu, opcode);
          }
          if ((opcode & 0x1000) == 0x1000) {
            instBLTU(cpu, opcode);
          }
          return;
        case 0x4000:
          if ((opcode & 0x1000) == 0x0) {
            instBALL(cpu, opcode);
          }
          if ((opcode & 0x1000) == 0x1000) {
            instBBC(cpu, opcode);
          }
          return;
        case 0x6000:
          instBBCI(cpu, opcode);
          return;
        case 0x8000:
          if ((opcode & 0x1000) == 0x0) {
            instBANY(cpu, opcode);
          }
          if ((opcode & 0x1000) == 0x1000) {
            instBNE(cpu, opcode);
          }
          return;
        case 0xa000:
          if ((opcode & 0x1000) == 0x0) {
            instBGE(cpu, opcode);
          }
          if ((opcode & 0x1000) == 0x1000) {
            instBGEU(cpu, opcode);
          }
          return;
        case 0xc000:
          if ((opcode & 0x1000) == 0x1000) {
            instBBS(cpu, opcode);
          }
          if ((opcode & 0x1000) == 0x0) {
            instBNALL(cpu, opcode);
          }
          return;
        case 0xe000:
          instBBSI(cpu, opcode);
          return;
      }
      return;
    case 0x8:
      instL32I_N(cpu, opcode);
      return;
    case 0x9:
      instS32I_N(cpu, opcode);
      return;
    case 0xa:
      instADD_N(cpu, opcode);
      return;
    case 0xb:
      instADDI_N(cpu, opcode);
      return;
    case 0xc:
      switch (opcode & 0x80) {
        case 0x0:
          instMOVI_N(cpu, opcode);
          return;
        case 0x80:
          if ((opcode & 0x40) == 0x0) {
            instBEQZ_N(cpu, opcode);
          }
          if ((opcode & 0x40) == 0x40) {
            instBNEZ_N(cpu, opcode);
          }
          return;
      }
      return;
    case 0xd:
      switch (opcode & 0xf000) {
        case 0x0:
          instMOV_N(cpu, opcode);
          return;
        case 0xf000:
          switch (opcode & 0xf0) {
            case 0x0:
              instRET(cpu, opcode);
              return;
            case 0x20:
              instBREAK_N(cpu, opcode);
              return;
            case 0x30:
              instNOP_N(cpu, opcode);
              return;
            case 0x60:
              instILL_N(cpu, opcode);
              return;
          }
          return;
      }
      return;
  }
  cpu.unknownInstruction(opcode);
}
