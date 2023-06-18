import { FrequencyClock } from '../clock/frequency-clock';
import { ISimulationClock } from '../clock/simulation-clock';

export const MHz = 1_000_000;

export class ESP8266Clocks {
  readonly apb;
  readonly cpu;

  readonly cpuFreq = 160 * MHz;
  readonly apbFreq = 80 * MHz;

  readonly xtalFreq = 40 * MHz;
  readonly rtc8mFreq = 8 * MHz;
  readonly refFreq = this.apbFreq;
  readonly cpuClockPeriod = 0;
  readonly cpuClockSource = 0;

  constructor(rootClock: ISimulationClock) {
    this.apb = new FrequencyClock(rootClock, this.apbFreq);
    this.cpu = new FrequencyClock(rootClock, this.cpuFreq);
  }
}
