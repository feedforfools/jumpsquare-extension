import type { MovieDetectedMessage } from "../../types/messaging.js";
import type { ServiceRegistry } from "../strategies/ServiceRegistry.js";

export class MovieDetector {
  private currentMovieTitle: string | null = null;
  private currentMovieYear: string | null = null;
  private isForcingRedetection: boolean = false;
  private detectionTimer: ReturnType<typeof setTimeout> | null = null;
  private serviceRegistry: ServiceRegistry;

  constructor(serviceRegistry: ServiceRegistry) {
    this.serviceRegistry = serviceRegistry;
  }

  identifyMovie(): void {
    if (
      this.currentMovieTitle &&
      this.currentMovieYear &&
      !this.isForcingRedetection
    ) {
      return;
    }

    if (this.detectionTimer) {
      clearTimeout(this.detectionTimer);
    }

    const strategy = this.serviceRegistry.getCurrentStrategy();
    if (!strategy) {
      console.warn(
        "[HTJ MovieDetector] No strategy available for current service"
      );
      return;
    }

    const movieInfo = strategy.extractMovieInfo();

    if (
      movieInfo &&
      movieInfo.title &&
      movieInfo.year &&
      movieInfo.title !== this.currentMovieTitle &&
      movieInfo.year !== this.currentMovieYear
    ) {
      this.currentMovieTitle = movieInfo.title;
      this.currentMovieYear = movieInfo.year;
      this.isForcingRedetection = false;

      console.log(
        `[HTJ Content] Detected movie: ${movieInfo.title}${
          movieInfo.year ? ` (${movieInfo.year})` : ""
        }. Sending to background.`
      );

      const message: MovieDetectedMessage = {
        type: "MOVIE_DETECTED",
        payload: { title: movieInfo.title, year: movieInfo.year },
      };

      chrome.runtime.sendMessage(message).catch((error) => {
        console.error(
          "[HTJ Content] Failed to send movie detection message:",
          error
        );
      });

      // Emit custom event for other modules to listen to
      document.dispatchEvent(
        new CustomEvent("movieChanged", {
          detail: { title: movieInfo.title, year: movieInfo.year },
        })
      );
    } else if (!movieInfo || !movieInfo.title || !movieInfo.year) {
      this.detectionTimer = setTimeout(() => {
        this.identifyMovie();
      }, 2000);
    }
  }

  forceRedetection(): void {
    this.isForcingRedetection = true;
  }

  reset(): void {
    this.currentMovieTitle = null;
    this.currentMovieYear = null;
    this.isForcingRedetection = false;
    if (this.detectionTimer) {
      clearTimeout(this.detectionTimer);
      this.detectionTimer = null;
    }
  }

  movieIsIdentified(): boolean {
    return !!(this.currentMovieTitle && this.currentMovieYear);
  }
}
