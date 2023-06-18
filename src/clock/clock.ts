import type { ISimulationClock } from './simulation-clock';

export const KHz = 1_000;
export const MHz = 1_000_000;

export type ClockEventCallback = () => void;

export type ClockFrequencyListener = (newFrequency: number, oldFrequency: number) => void;

export interface IClockEvent {
  schedule(deltaTicks: number): void;
  unschedule(): void;
}

export interface IClock {
  readonly frequency: number;
  readonly ticks: number;
  createEvent(callback: ClockEventCallback): IClockEvent;
}

export interface IDynamicClock extends IClock {
  rootClock: ISimulationClock;
  addFrequencyListener(listener: ClockFrequencyListener): void;
  removeFrequencyListener(listener: ClockFrequencyListener): void;
}
