import type { Jumpscare } from "../../types/index.js";
import { WARNING_WINDOW_SECONDS } from "../../shared/utils/constants.js";
import { NotificationManager } from "./NotificationManager.ts";

interface JumpscareWithTime extends Jumpscare {
  timeInSeconds: number;
}

export class JumpscareMonitor {
  private jumpscares: JumpscareWithTime[] = [];
  private nextJumpscareIndex: number = 0;
  private shownAlerts: Set<string> = new Set();
  private isEnabled: boolean = true;
  private notificationManager: NotificationManager;

  constructor() {
    this.notificationManager = new NotificationManager();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Reset when movie changes
    document.addEventListener("movieChanged", () => {
      this.reset();
    });
  }

  setJumpscares(jumpscares: Jumpscare[]): void {
    this.jumpscares = jumpscares.map((j) => ({
      ...j,
      timeInSeconds: j.timestamp_minutes * 60 + j.timestamp_seconds,
    }));
    this.nextJumpscareIndex = 0;
    this.shownAlerts.clear();
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  checkJumpscares(currentTime: number): void {
    if (
      !this.isEnabled ||
      this.jumpscares.length === 0 ||
      this.nextJumpscareIndex >= this.jumpscares.length
    ) {
      return;
    }

    const jumpscareWithTime = this.jumpscares[this.nextJumpscareIndex];

    if (currentTime > jumpscareWithTime.timeInSeconds) {
      this.nextJumpscareIndex++;
      return;
    }

    const alertStartTime =
      jumpscareWithTime.timeInSeconds - WARNING_WINDOW_SECONDS;

    if (
      currentTime >= alertStartTime &&
      !this.shownAlerts.has(jumpscareWithTime.id)
    ) {
      console.log(
        `[HTJ Content] Showing notification for jumpscare ID ${jumpscareWithTime.id}`
      );
      this.notificationManager.displayJumpscareNotification(jumpscareWithTime);
      this.shownAlerts.add(jumpscareWithTime.id);
    }
  }

  private reset(): void {
    this.jumpscares = [];
    this.nextJumpscareIndex = 0;
    this.shownAlerts.clear();
  }
}
