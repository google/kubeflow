import { Subscription, Subject, interval, timer } from "rxjs";

export interface BackoffConfig {
  retries?: number;
  interval?: number;
  maxInterval?: number;
}

const defaultConfig: BackoffConfig = {
  retries: 1,
  interval: 1000,
  maxInterval: 16000
};

export class ExponentialBackoff {
  // An instance of this class will have an Observable (poller) that
  // will emit a value in Exponential Backoff manner. We can then make
  // a subscription to it and apply our logic
  private retries: number;
  private interval: number;
  private maxInterval: number;

  private scheduler: Subscription;
  private poller: Subject<number>;
  private n: number;

  private remainingTries: number;
  private currInterval: number;

  constructor(config: BackoffConfig = defaultConfig) {
    const conf = { ...defaultConfig, ...config };

    this.retries = conf.retries;
    this.interval = conf.interval;
    this.maxInterval = conf.maxInterval;

    this.poller = new Subject<number>();

    this.n = 0;
    this.remainingTries = this.retries + 1;
    this.currInterval = this.interval;
  }

  public start() {
    // Reset the shceduler
    if (this.scheduler) {
      this.scheduler.unsubscribe();
    }

    // Start the Exponential Backoff. All the logic is in iterate()
    this.scheduler = timer(0, this.interval).subscribe(() => {
      this.iterate();
    });

    return this.poller;
  }

  private iterate() {
    // Emit a new value
    this.n++;
    this.poller.next(this.n);

    // Cancel the previous subscription and reduce the retries
    // If no more retries, then double the interval
    this.scheduler.unsubscribe();
    this.remainingTries--;
    if (this.remainingTries === 0) {
      this.remainingTries = this.retries;
      this.currInterval = Math.min(this.currInterval * 2, this.maxInterval);
    }

    this.scheduler = interval(this.currInterval).subscribe(() => {
      this.iterate();
    });
  }

  public reset() {
    this.n = 0;
    this.currInterval = this.interval;
    this.remainingTries = this.retries + 1;

    this.start();
  }

  public stop() {
    if (this.scheduler) {
      this.scheduler.unsubscribe();
    }
  }

  public getPoller() {
    return this.poller;
  }
}
