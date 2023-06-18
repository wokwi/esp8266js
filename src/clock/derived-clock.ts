import { IDynamicClock } from './clock';
import { DyanmicClock } from './dynamic-clock';

export class DerivedClock extends DyanmicClock {
  constructor(private parentClock: IDynamicClock, private multiplierValue: number) {
    super(parentClock.rootClock, parentClock.frequency * multiplierValue);
    parentClock.addFrequencyListener(this.update);
  }

  private update = () => {
    const oldFrequency = this.frequencyValue;
    const frequency = this.parentClock.frequency * this.multiplierValue;
    if (frequency !== oldFrequency) {
      this.setFrequency(frequency);
    }
  };

  get multiplier() {
    return this.multiplierValue;
  }

  set multiplier(value: number) {
    this.multiplierValue = value;
    this.update();
  }

  get divider() {
    return this.multiplierValue ? 1 / this.multiplierValue : 0;
  }

  set divider(value: number) {
    this.multiplierValue = value ? 1 / value : 0;
    this.update();
  }

  get parent() {
    return this.parentClock;
  }

  set parent(parent: IDynamicClock) {
    if (parent !== this.parentClock) {
      this.parentClock.removeFrequencyListener(this.update);
      this.parentClock = parent;
      parent.addFrequencyListener(this.update);
      this.update();
    }
  }
}
