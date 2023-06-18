import { ClockEventCallback, ClockFrequencyListener, IClockEvent, IDynamicClock } from './clock';
import { DynamicClockEvent } from './dynamic-clock-event';
import { ISimulationClock } from './simulation-clock';

export abstract class DyanmicClock implements IDynamicClock {
  protected readonly listeners = new Set<ClockFrequencyListener>();
  protected baseTicks = 0;
  protected baseNanos = 0;

  constructor(readonly rootClock: ISimulationClock, protected frequencyValue: number) {}

  get ticks() {
    const { baseTicks, baseNanos } = this;
    return ((this.rootClock.nanos - baseNanos) / 1e9) * this.frequency + baseTicks;
  }

  protected setFrequency(frequency: number) {
    const oldFrequency = this.frequencyValue;
    if (frequency !== oldFrequency) {
      this.baseTicks = this.ticks;
      this.baseNanos = this.rootClock.nanos;
      this.frequencyValue = frequency;
      for (const listener of this.listeners) {
        listener(this.frequencyValue, oldFrequency);
      }
    }
  }

  get frequency() {
    return this.frequencyValue;
  }

  createEvent(callback: ClockEventCallback): IClockEvent {
    return new DynamicClockEvent(this, callback);
  }

  addFrequencyListener(listener: ClockFrequencyListener): void {
    this.listeners.add(listener);
  }

  removeFrequencyListener(listener: ClockFrequencyListener): void {
    this.listeners.delete(listener);
  }
}
