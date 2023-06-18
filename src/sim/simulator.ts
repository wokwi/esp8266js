import { ESP8266 } from '../esp8266';

const MILLIS = 1000 * 1000; // nanoseconds
const slice = 10 * MILLIS;

export class Simulator {
  executeTimer: ReturnType<typeof setTimeout> | null = null;
  stopped = true;
  lastExecuted = 0;
  throttle?: number;
  lastTime = BigInt(0);

  constructor(readonly cpu: ESP8266) {}

  execute(throttleDelta = 0) {
    const { cpu } = this;
    const { throttle } = this;
    if (this.executeTimer) {
      this.stop();
    }

    let startTime = throttle != null ? process.hrtime.bigint() : BigInt(0);

    this.stopped = false;
    const deadline = cpu.clock.nanos + slice;
    while (cpu.clock.nanos < deadline && !this.stopped) {
      if (cpu.coresIdle) {
        cpu.clock.skipToNextEvent(deadline);
      }
      cpu.step();
    }

    if (this.stopped) {
      return;
    }

    let delayNanos = 0;
    let delay = 0;
    if (this.throttle != null) {
      const endTime = process.hrtime.bigint();
      const elapsed = Number(endTime - startTime);
      const target = slice / (this.throttle / 100);
      delayNanos = Math.max(0, target - elapsed) - throttleDelta;
      delay = Math.round(delayNanos / MILLIS);
      this.lastTime = endTime;
    }
    this.executeTimer = setTimeout(() => {
      let throttleError = 0;
      if (this.lastTime > 0) {
        throttleError = Number(process.hrtime.bigint() - this.lastTime) - delayNanos;
        this.lastTime = BigInt(0);
      }
      this.executeTimer = null;
      this.execute(throttleError);
    }, delay);
  }

  stop() {
    this.stopped = true;
    if (this.executeTimer != null) {
      clearTimeout(this.executeTimer);
      this.executeTimer = null;
      this.lastTime = BigInt(0);
    }
  }

  get executing() {
    return !this.stopped;
  }
}
