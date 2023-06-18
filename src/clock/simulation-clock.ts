import { ClockEventCallback, IClock } from './clock';
import { ClockEvent } from './clock-event';

export interface ISimulationClock extends IClock {
  readonly nanos: number;
  skipToNextEvent(deadline: number): void;

  /** @deprecated use createEvent() instead */
  schedule(callback: ClockEventCallback, ns: number): ClockEventCallback;
  /** @deprecated use createEvent() instead */
  unschedule(callback: ClockEventCallback): boolean;
}

interface IClockEventEntry {
  cycles: number;
  callback: ClockEventCallback;
  next: IClockEventEntry | null;
}

export class SimulationClock implements ISimulationClock {
  private nextClockEvent: IClockEventEntry | null = null;
  private readonly clockEventPool: IClockEventEntry[] = []; // helps avoid garbage collection

  constructor(readonly frequency = 125e6, public cpu: { cycles: number } = { cycles: 0 }) {}

  get micros() {
    return this.nanos / 1000;
  }

  get millis() {
    return (this.cpu.cycles / this.frequency) * 1000;
  }

  get nanos() {
    return (this.cpu.cycles / this.frequency) * 1e9;
  }

  get ticks() {
    return this.nanos;
  }

  createEvent(callback: ClockEventCallback) {
    return new ClockEvent(this, callback);
  }

  schedule(callback: ClockEventCallback, nanos: number) {
    const cycles = Math.round((nanos / 1e9) * this.frequency);
    return this.addEventCycles(callback, cycles);
  }

  unschedule(callback: ClockEventCallback) {
    let { nextClockEvent: clockEvent } = this;
    if (!clockEvent) {
      return false;
    }
    const { clockEventPool } = this;
    let lastItem = null;
    while (clockEvent) {
      if (clockEvent.callback === callback) {
        if (lastItem) {
          lastItem.next = clockEvent.next;
        } else {
          this.nextClockEvent = clockEvent.next;
        }
        if (clockEventPool.length < 10) {
          clockEventPool.push(clockEvent);
        }
        return true;
      }
      lastItem = clockEvent;
      clockEvent = clockEvent.next;
    }
    return false;
  }

  addEventCycles(callback: ClockEventCallback, cycles: number) {
    const { clockEventPool } = this;
    cycles = this.cpu.cycles + Math.max(1, cycles);
    const maybeEntry = clockEventPool.pop();
    const entry: IClockEventEntry = maybeEntry ?? { cycles, callback, next: null };
    entry.cycles = cycles;
    entry.callback = callback;
    let { nextClockEvent: clockEvent } = this;
    let lastItem = null;
    while (clockEvent && clockEvent.cycles < cycles) {
      lastItem = clockEvent;
      clockEvent = clockEvent.next;
    }
    if (lastItem) {
      lastItem.next = entry;
      entry.next = clockEvent;
    } else {
      this.nextClockEvent = entry;
      entry.next = clockEvent;
    }
    return callback;
  }

  tick() {
    const { nextClockEvent } = this;
    if (nextClockEvent && nextClockEvent.cycles <= this.cpu.cycles) {
      this.nextClockEvent = nextClockEvent.next;
      if (this.clockEventPool.length < 10) {
        this.clockEventPool.push(nextClockEvent);
      }
      nextClockEvent.callback();
    }
  }

  skipToNextEvent(deadline: number = 0) {
    const { nextClockEvent, frequency } = this;
    if (nextClockEvent && (nextClockEvent.cycles / frequency) * 1e9 <= deadline) {
      this.cpu.cycles = nextClockEvent.cycles;
      this.nextClockEvent = nextClockEvent.next;
      if (this.clockEventPool.length < 10) {
        this.clockEventPool.push(nextClockEvent);
      }
      nextClockEvent.callback();
    } else if (deadline > this.nanos) {
      this.cpu.cycles = Math.round(deadline * (frequency / 1e9));
    }
  }

  get nextClockEventCycles() {
    return this.nextClockEvent?.cycles ?? 0;
  }
}
