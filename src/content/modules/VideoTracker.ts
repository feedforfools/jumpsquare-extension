import type { ServiceRegistry } from "../strategies/ServiceRegistry.js";

export class VideoTracker {
  private videoElement: HTMLVideoElement | null = null;
  private timeUpdateCallback: ((currentTime: number) => void) | null = null;
  private serviceRegistry: ServiceRegistry;

  constructor(serviceRegistry: ServiceRegistry) {
    this.serviceRegistry = serviceRegistry;
  }

  setTimeUpdateCallback(callback: (currentTime: number) => void): void {
    this.timeUpdateCallback = callback;
  }

  attachVideoListener(): void {
    const strategy = this.serviceRegistry.getCurrentStrategy();
    if (!strategy) {
      console.warn("[HTJ VideoTracker] No strategy available");
      return;
    }

    const newVideoElement = strategy.getVideoElement();
    if (newVideoElement && newVideoElement !== this.videoElement) {
      console.log(
        "[HTJ VideoTracker] Video player found. Attaching time listener."
      );

      if (this.videoElement) {
        this.videoElement.removeEventListener(
          "timeupdate",
          this.handleTimeUpdate
        );
      }

      this.videoElement = newVideoElement;
      this.videoElement.addEventListener("timeupdate", this.handleTimeUpdate);
    }
  }

  private handleTimeUpdate = (event: Event): void => {
    const video = event.target as HTMLVideoElement;
    if (this.timeUpdateCallback && !video.paused) {
      this.timeUpdateCallback(video.currentTime);
    }
  };

  cleanup(): void {
    if (this.videoElement) {
      this.videoElement.removeEventListener(
        "timeupdate",
        this.handleTimeUpdate
      );
      this.videoElement = null;
    }
  }
}
