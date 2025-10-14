import type { Movie } from "../../types/index.js";
import type { JumpscareEvent } from "./JumpscareScheduler.js";
import { Toast, type ToastConfig } from "./Toast.js";

export class NotificationPresenter {
  private toast = new Toast();
  private isEnabled = true;

  private hasShownWelcome = false;
  private currentMovie: Movie | null = null;

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.toast.clearToast();
    }
  }

  setMovie(movie: Movie): void {
    // New movie means the welcome can be shown again
    this.currentMovie = movie;
    this.hasShownWelcome = false;
  }

  showWelcomeMessage(): void {
    if (this.hasShownWelcome || !this.currentMovie) return;

    const config = this.createIntroToastConfig();
    this.toast.showToast(config);
    this.hasShownWelcome = true;
    console.log("[HTJ Welcome] Displayed welcome message");
  }

  handleJumpscareEvent(event: JumpscareEvent): void {
    if (!this.isEnabled) return;

    // Dismiss the welcome if it’s still up
    if (this.hasShownWelcome) {
      this.toast.clearToast();
    }

    const toastId = `htj-${event.jumpscareIndex}`;
    const config = this.createJumpscareToastConfig(event, toastId);
    this.toast.showToast(config);
    this.logJumpscareAlert(event);
  }

  reset(): void {
    this.hasShownWelcome = false;
    this.currentMovie = null;
    this.toast.clearToast();
    console.log("[HTJ Notification] Reset notifications");
  }

  private createIntroToastConfig(): ToastConfig {
    return {
      id: "htj-welcome",
      message: this.createWelcomeMessage(this.currentMovie!),
      icon: "🎬",
      displayDuration: 10000,
      class: "info",
    };
  }

  private createJumpscareToastConfig(
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

  private createWelcomeMessage(movie: Movie): string {
    if (!movie.isInDb) {
      return `This movie isn't in our database yet.\nNo jumpscare data available.`;
    }

    if (movie.jumpscareCount === 0) {
      return `This movie has\nno jumpscares.\nEnjoy watching! 🍿`;
    }

    const jumpscareText =
      movie.jumpscareCount === 1
        ? "1 jumpscare"
        : `${movie.jumpscareCount} jumpscares`;

    return `Found ${jumpscareText} in this movie.\nYou'll get alerts before each one.\nEnjoy! 🍿`;
  }
}
