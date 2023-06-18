import { ESP8266 } from '../esp8266';
import { BasePeripheral } from './base-peripheral';

const GPIO_OUT_REG = 0x000;
const GPIO_OUT_W1TS_REG = 0x004;
const GPIO_OUT_W1TC_REG = 0x008;
const GPIO_ENABLE_REG = 0x00c;
const GPIO_ENABLE_W1TS_REG = 0x010;
const GPIO_ENABLE_W1TC_REG = 0x014;
const GPIO_IN_REG = 0x018;
const GPIO_STATUS_REG = 0x01c;
const GPIO_STATUS_W1TS_REG = 0x020;
const GPIO_STATUS_W1TC_REG = 0x024;
const GPIO_PIN0_REG = 0x28;

const GPIO_PINn_PAD_DRIVER = 1 << 2;

// GPIO_FUNCn_OUT_SEL_CFG_REG bits
const GPIO_FUNCn_OEN_INV_SEL = 1 << 11;
const GPIO_FUNCn_OEN_SEL = 1 << 10;
const GPIO_FUNCn_OUT_INV_SEL = 1 << 9;
const GPIO_FUNCn_OUT_SEL_SHIFT = 0;
const GPIO_FUNCn_OUT_SEL_MASK = 0x1ff;

// GPIO_PINn_REG bits
const GPIO_PINn_INT_TYPE_SHIFT = 7;
const GPIO_PINn_INT_TYPE_MASK = 0x7;
const GPIO_PINn_INT_ENA_APP_CPU = 1 << 13;
const GPIO_PINn_INT_ENA_APP_CPU_NMI = 1 << 14;
const GPIO_PINn_INT_ENA_PRO_CPU = 1 << 15; // Datasheet says 16, but is wrong
const GPIO_PINn_INT_ENA_PRO_CPU_NMI = 1 << 16;

const PIN_COUNT = 16;

export enum IOPinState {
  Low,
  High,
  Input,
  PullUp,
  PullDown,
}

enum IntType {
  Disable,
  RisingEdge,
  FallingEdge,
  Edge,
  LowLevel,
  HighLevel,
}

export type IOPinListener = (newState: IOPinState, oldState: IOPinState) => void;

export class IOPin {
  private listeners = new Set<IOPinListener>();
  private intType = IntType.Disable;
  private outputEnableValue = false;

  state: IOPinState = IOPinState.Input;

  openDrain = false;
  internalPullDown = false;
  internalPullUp = false;
  muxFunction = 0;
  rtcPullDown = false;
  rtcPullUp = false;

  gpioOutput = false;
  gpioOutputEnable = false;

  get outputEnable() {
    return this.outputEnableValue;
  }

  // GPIO Matrix flags
  matrixEnable = false;
  matrixSelectOutputEnable = false;
  matrixOutputEnableInvert = false;
  matrixOutputInvert = false;
  matrixOutput = false;
  matrixOutputEnable = false;

  readonly bank = this.id < 32 ? 0 : 1;

  constructor(readonly gpio: ESP8266GPIO, readonly id: number) {}

  reset() {
    this.state = IOPinState.Input;
    this.internalPullDown = false;
    this.internalPullUp = false;
    this.rtcPullDown = false;
    this.rtcPullUp = false;
    this.gpioOutput = false;
    this.gpioOutputEnable = false;
    this.openDrain = false;
    this.matrixEnable = false;
    this.matrixSelectOutputEnable = false;
    this.matrixOutputEnableInvert = false;
    this.matrixOutputInvert = false;
    this.matrixOutput = false;
    this.matrixOutputEnable = false;
  }

  get inputValue() {
    const { id, bank } = this;
    const bitIndex = id % 32;
    return !!(this.gpio.inputValues[bank] & (1 << bitIndex));
  }

  set inputValue(value: boolean) {
    const { id, bank } = this;
    const { inputValues } = this.gpio;
    const bitIndex = id % 32;
    if (value === !!(inputValues[bank] & (1 << bitIndex))) {
      return;
    }
    if (value) {
      inputValues[bank] |= 1 << bitIndex;
    } else {
      inputValues[bank] &= ~(1 << bitIndex);
    }

    let setInterrupt = false;
    let clearInterrupt = false;
    switch (this.intType) {
      case IntType.FallingEdge:
        setInterrupt = !value;
        break;

      case IntType.RisingEdge:
        setInterrupt = value;
        break;

      case IntType.Edge:
        setInterrupt = true;
        break;

      case IntType.LowLevel:
        setInterrupt = !value;
        clearInterrupt = value;
        break;

      case IntType.HighLevel:
        setInterrupt = value;
        clearInterrupt = !value;
        break;
    }

    if (setInterrupt) {
      this.gpio.intStatus[bank] |= 1 << bitIndex;
      this.gpio.interruptsUpdated();
    }
    if (clearInterrupt) {
      this.gpio.intStatus[bank] &= ~(1 << bitIndex);
      this.gpio.interruptsUpdated();
    }
  }

  internalUpdateState(newState: IOPinState) {
    const oldState = this.state;
    this.state = newState;
    for (const listener of this.listeners) {
      listener(newState, oldState);
    }
  }

  internalSetInterrupt(intType: IntType) {
    const { id, bank } = this;
    const bitIndex = id % 32;

    this.intType = intType;

    let setInterrupt = false;
    let updateInterrupts = false;

    switch (intType) {
      case IntType.LowLevel:
        setInterrupt = !this.inputValue;
        updateInterrupts = true;
        break;

      case IntType.HighLevel:
        setInterrupt = this.inputValue;
        updateInterrupts = true;
        break;
    }

    if (updateInterrupts) {
      if (setInterrupt) {
        this.gpio.intStatus[bank] |= 1 << bitIndex;
      } else {
        this.gpio.intStatus[bank] &= ~(1 << bitIndex);
      }
    }
  }

  update() {
    const openState =
      this.internalPullUp || this.rtcPullUp
        ? IOPinState.PullUp
        : this.internalPullDown || this.rtcPullDown
        ? IOPinState.PullDown
        : IOPinState.Input;
    const highState = this.openDrain ? openState : IOPinState.High;
    const output = this.matrixEnable ? this.matrixOutput : this.gpioOutput;
    const outputState = output ? highState : IOPinState.Low;
    const outputEnable =
      this.matrixEnable && this.matrixSelectOutputEnable
        ? this.matrixOutputEnable
        : this.gpioOutputEnable;
    const newState = outputEnable ? outputState : openState;
    this.outputEnableValue = outputEnable;
    if (this.state !== newState) {
      this.internalUpdateState(newState);
    }
  }

  addListener(listener: IOPinListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export class ESP8266GPIO extends BasePeripheral {
  readonly pins: IOPin[] = [];

  inputValues = [0];

  // Interrupts
  intStatus = [0];
  proIntEnable = [0];
  proNMIIntEnable = [0];

  constructor(readonly esp: ESP8266, baseAddr: number, name: string, readonly irq: number) {
    super(esp, baseAddr, name);
    for (let i = 0; i < PIN_COUNT; i++) {
      this.pins.push(new IOPin(this, i));
    }
  }

  updateGPIO() {
    const enable = this.readRegister(GPIO_ENABLE_REG);
    const output = this.readRegister(GPIO_OUT_REG);
    const { pins } = this;
    for (let i = 0; i < PIN_COUNT; i++) {
      const mask = 1 << i;
      const pin = pins[i];
      pin.openDrain = !!(this.readRegister(GPIO_PIN0_REG + i * 4) & GPIO_PINn_PAD_DRIVER);
      pin.gpioOutput = !!(output & mask);
      pin.gpioOutputEnable = !!(enable & mask);
      pin.update();
    }
  }

  setBoot() {
    // No-op
  }

  captureStrap() {
    // No-op
  }

  readUint32(addr: number) {
    switch (addr - this.baseAddr) {
      case GPIO_IN_REG:
        return (0x3 << 16) | (0x7 << 29) | this.inputValues[0];
      case GPIO_STATUS_REG:
        return this.intStatus[0];
      default:
        return super.readUint32(addr);
    }
  }

  writeUint32(addr: number, value: number) {
    const offset = addr - this.baseAddr;

    switch (offset) {
      case GPIO_OUT_REG:
      case GPIO_ENABLE_REG:
        this.writeRegister(offset, value);
        this.updateGPIO();
        return;

      case GPIO_OUT_W1TS_REG:
        this.setRegisterBits(GPIO_OUT_REG, value);
        this.updateGPIO();
        return;

      case GPIO_OUT_W1TC_REG:
        this.clearRegisterBits(GPIO_OUT_REG, value);
        this.updateGPIO();
        return;

      case GPIO_ENABLE_W1TS_REG:
        this.setRegisterBits(GPIO_ENABLE_REG, value);
        this.updateGPIO();
        return;

      case GPIO_ENABLE_W1TC_REG:
        this.clearRegisterBits(GPIO_ENABLE_REG, value);
        this.updateGPIO();
        return;

      case GPIO_STATUS_W1TS_REG:
        this.intStatus[0] |= value;
        this.interruptsUpdated();
        return;

      case GPIO_STATUS_W1TC_REG:
        this.intStatus[0] &= ~value;
        this.interruptsUpdated();
        return;
    }

    if (offset >= GPIO_PIN0_REG && offset <= GPIO_PIN0_REG + PIN_COUNT * 4) {
      const gpioIndex = (offset - GPIO_PIN0_REG) >> 2;
      this.pins[gpioIndex].internalSetInterrupt(
        (value >> GPIO_PINn_INT_TYPE_SHIFT) & GPIO_PINn_INT_TYPE_MASK
      );
      this.interruptsUpdated();
    }

    super.writeUint32(addr, value);
  }

  interruptsUpdated() {
    const { intStatus, irq } = this;
    this.esp.interrupt(irq, !!intStatus[0]);
  }

  reset() {
    for (const pin of this.pins) {
      pin.reset();
    }
  }
}
