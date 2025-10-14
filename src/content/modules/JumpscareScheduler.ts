import type { Jumpscare } from "../../types/index.js";
import { WARNING_WINDOW_SECONDS } from "../../shared/utils/constants.js";

export interface JumpscareEvent {
  jumpscareIndex: number;
  jumpscare: Jumpscare;
  timeRemaining: number;
}

interface JumpscareWindow {
  startTime: number;
  endTime: number;
  jumpscareIndex: number;
  jumpscare: Jumpscare;
}

export class JumpscareScheduler {
  private jumpscares: Jumpscare[] = [];
  private jumpscareWindows: JumpscareWindow[] = [];
  private timeToWindowMap = new Map<number, JumpscareWindow>();
  private currentlyTriggeredIndex: number | null = null;
  private onJumpscareCallback: ((event: JumpscareEvent) => void) | null = null;

  private readonly TIME_PRECISION = 1.0; // 1s precision for lookup table

  constructor() {}

  setJumpscares(jumpscares: Jumpscare[]): void {
    this.jumpscares = jumpscares;
    this.buildLookupStructures();
    this.currentlyTriggeredIndex = null;
  }

  setJumpscareCallback(callback: (event: JumpscareEvent) => void): void {
    this.onJumpscareCallback = callback;
  }

  processTimeUpdate(currentTime: number): void {
    if (!this.onJumpscareCallback || this.jumpscares.length === 0) {
      return;
    }

    const roundedTime = this.roundTime(currentTime);
    const window = this.timeToWindowMap.get(roundedTime);

    if (window) {
      if (this.currentlyTriggeredIndex !== window.jumpscareIndex) {
        const timeRemaining = window.jumpscare.timeInSeconds - currentTime;

        console.log(
          `[HTJ Scheduler] Triggering jumpscare alert #${
            window.jumpscareIndex + 1
          } - ${timeRemaining.toFixed(1)}s remaining`
        );

        this.onJumpscareCallback({
          jumpscareIndex: window.jumpscareIndex,
          jumpscare: window.jumpscare,
          timeRemaining,
        });

        this.currentlyTriggeredIndex = window.jumpscareIndex;
      }
    } else {
      if (this.currentlyTriggeredIndex !== null) {
        this.currentlyTriggeredIndex = null;
      }
    }
  }

  private buildLookupStructures(): void {
    this.jumpscareWindows = [];
    this.timeToWindowMap.clear();

    this.jumpscares.forEach((jumpscare, index) => {
      const startTime = jumpscare.timeInSeconds - WARNING_WINDOW_SECONDS;
      const endTime = jumpscare.timeInSeconds;

      const window: JumpscareWindow = {
        startTime,
        endTime,
        jumpscareIndex: index,
        jumpscare,
      };

      this.jumpscareWindows.push(window);
      for (let time = startTime; time <= endTime; time += this.TIME_PRECISION) {
        const roundedTime = this.roundTime(time);
        // Only set if not already occupied (in case of overlapping windows) => shouldn't happen
        if (!this.timeToWindowMap.has(roundedTime)) {
          this.timeToWindowMap.set(roundedTime, window);
        }
      }
    });
  }

  private roundTime(time: number): number {
    return Math.round(time / this.TIME_PRECISION) * this.TIME_PRECISION;
  }

  reset(): void {
    this.jumpscares = [];
    this.jumpscareWindows = [];
    this.timeToWindowMap.clear();
    this.currentlyTriggeredIndex = null;
    console.log("[HTJ Scheduler] Reset scheduler state");
  }
}
