import { ClockEventCallback, IClockEvent } from './clock';
import { SimulationClock } from './simulation-clock';

export class ClockEvent implements IClockEvent {
  constructor(private readonly clock: SimulationClock, readonly callback: ClockEventCallback) {}

  schedule(deltaNanos: number): void {
    this.unschedule();
    this.clock.schedule(this.callback, deltaNanos);
  }

  unschedule(): void {
    this.clock.unschedule(this.callback);
  }
}
