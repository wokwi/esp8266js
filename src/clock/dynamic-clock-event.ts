import { ClockEventCallback, IClock, IClockEvent, IDynamicClock } from './clock';

export class DynamicClockEvent implements IClockEvent {
  readonly rootClock: IClock = this.clock.rootClock;

  private readonly rootEvent;

  constructor(private clock: IDynamicClock, callback: ClockEventCallback) {
    this.rootEvent = this.rootClock.createEvent(callback);
  }

  schedule(deltaTicks: number): void {
    const deltaNanos = (deltaTicks * 1e9) / this.clock.frequency;
    this.rootEvent.schedule(deltaNanos);
    // TODO should be able to update target time if the target clock frequency changes
  }

  unschedule() {
    this.rootEvent.unschedule();
  }
}
