import type { JumpscareEvent } from "./JumpscareScheduler.js";
import { Toast, type ToastConfig } from "./Toast.js";

export class JumpscareDisplayManager {
  private isEnabled: boolean = true;
  private JumpscareToast: Toast;

  constructor() {
    this.JumpscareToast = new Toast();
  }

  handleJumpscareEvent(event: JumpscareEvent): void {
    if (!this.isEnabled) return;

    const toastId = `htj-${event.jumpscareIndex}`;
    const config = this.createToastConfig(event, toastId);
    this.JumpscareToast.showToast(config);
    this.logJumpscareAlert(event);
  }

  private createToastConfig(
    event: JumpscareEvent,
    toastId: string
  ): ToastConfig {
    const { jumpscare, timeRemaining } = event;

    // Determine severity and message
    const isMajor = jumpscare.category === "major";
    const message = isMajor
      ? "Major jumpscare incoming. Watch out!"
      : "Minor jumpscare incoming";
    const icon = "⚠️";

    // Auto-remove after warning window duration
    const displayDuration = Math.max(timeRemaining * 1000, 3000);

    return {
      id: toastId,
      message,
      icon,
      displayDuration,
      class: jumpscare.category as "minor" | "major" | "info",
    };
  }

  private logJumpscareAlert(event: JumpscareEvent): void {
    const { jumpscare } = event;
    const isMajor = jumpscare.category === "major";

    console.log(`🎬 JUMPSCARE ALERT #${event.jumpscareIndex}:`);
    console.log(`   Category: ${jumpscare.category.toUpperCase()}`);
    console.log(`   Severity: ${isMajor ? "MAJOR" : "Minor"}`);
    console.log(`   Time remaining: ${event.timeRemaining.toFixed(1)}s`);
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.JumpscareToast.clearToast();
    }
  }
}
