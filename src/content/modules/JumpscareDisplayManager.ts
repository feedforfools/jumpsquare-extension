import type { JumpscareEvent } from "./JumpscareScheduler.js";

export class JumpscareDisplayManager {
  private isEnabled: boolean = true;

  constructor() {}

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    console.log(
      `[HTJ Display] Jumpscare display ${enabled ? "enabled" : "disabled"}`
    );
  }

  handleJumpscareEvent(event: JumpscareEvent): void {
    if (!this.isEnabled) {
      return;
    }

    const { jumpscareIndex, jumpscare, timeRemaining } = event;

    console.log(`🎬 JUMPSCARE ALERT #${jumpscareIndex}:`);
    console.log(`   Category: ${jumpscare.category.toUpperCase()}`);
    console.log(`   Time remaining: ${timeRemaining.toFixed(1)}s`);
    console.log(
      `   At: ${Math.floor(
        jumpscare.timestamp_minutes
      )}:${jumpscare.timestamp_seconds.toString().padStart(2, "0")}`
    );

    if (jumpscare.description) {
      console.log(`   Description: ${jumpscare.description}`);
    }

    // TODO: Replace with custom HTML toast notification
    // this.showToastNotification(event);
  }

  // TODO: Future method for HTML notifications
  //   private showToastNotification(event: JumpscareEvent): void {
  //   }
}
