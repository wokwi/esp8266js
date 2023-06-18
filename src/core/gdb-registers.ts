import { RegisterType } from './register-type';
import {
  CCOMPARE0,
  CCOUNT,
  CONFIGID0,
  CONFIGID1,
  DBREAKA0,
  DBREAKC0,
  DDR,
  DEBUGCAUSE,
  DEPC,
  EPC1,
  EPC2,
  EPC3,
  EPS2,
  EPS3,
  EXCCAUSE,
  EXCSAVE1,
  EXCSAVE2,
  EXCSAVE3,
  EXCVADDR,
  IBREAKA0,
  IBREAKENABLE,
  ICOUNT,
  ICOUNTLEVEL,
  INTCLEAR,
  INTENABLE,
  INTSET,
  LITBASE,
  MMID,
  PRID,
  PS,
  SAR,
  VECBASE,
} from './xtensa-regs';

export const esp8266GDBRegisters = [
  RegisterType.AR | 0,
  RegisterType.AR | 1,
  RegisterType.AR | 2,
  RegisterType.AR | 3,
  RegisterType.AR | 4,
  RegisterType.AR | 5,
  RegisterType.AR | 6,
  RegisterType.AR | 7,
  RegisterType.AR | 8,
  RegisterType.AR | 9,
  RegisterType.AR | 10,
  RegisterType.AR | 11,
  RegisterType.AR | 12,
  RegisterType.AR | 13,
  RegisterType.AR | 14,
  RegisterType.AR | 15,
  RegisterType.PC,
  RegisterType.Special | SAR,
  RegisterType.Special | LITBASE,
  RegisterType.Special | CONFIGID0,
  RegisterType.Special | CONFIGID1,
  RegisterType.Special | PS,
  RegisterType.Special | MMID,
  RegisterType.Special | IBREAKENABLE,
  RegisterType.Special | DDR,
  RegisterType.Special | IBREAKA0,
  RegisterType.Special | DBREAKA0,
  RegisterType.Special | DBREAKC0,
  RegisterType.Special | EPC1,
  RegisterType.Special | EPC2,
  RegisterType.Special | EPC3,
  RegisterType.Special | DEPC,
  RegisterType.Special | EPS2,
  RegisterType.Special | EPS3,
  RegisterType.Special | EXCSAVE1,
  RegisterType.Special | EXCSAVE2,
  RegisterType.Special | EXCSAVE3,
  0, // interrupts?
  RegisterType.Special | INTSET,
  RegisterType.Special | INTCLEAR,
  RegisterType.Special | INTENABLE,
  RegisterType.Special | VECBASE,
  RegisterType.Special | EXCCAUSE,
  RegisterType.Special | DEBUGCAUSE,
  RegisterType.Special | CCOUNT,
  RegisterType.Special | PRID,
  RegisterType.Special | ICOUNT,
  RegisterType.Special | ICOUNTLEVEL,
  RegisterType.Special | EXCVADDR,
  RegisterType.Special | CCOMPARE0,
];
