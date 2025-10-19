import type { MovieDetectedMessage } from "../../types/messaging.js";
import type { ServiceRegistry } from "../strategies/ServiceRegistry.js";

export class MovieDetector {
  private currentMovieTitle: string | null = null;
  private currentMovieYear: string | null = null;
  private currentMovieId: string | null = null;
  private isForcingRedetection: boolean = false;
  private isDetecting: boolean = false;
  private detectionTimer: ReturnType<typeof setTimeout> | null = null;
  private serviceRegistry: ServiceRegistry;

  // Simple in-memory cache => survives SPA nav within same tab
  private idCache = new Map<string, { title: string; year: string | null }>();

  constructor(serviceRegistry: ServiceRegistry) {
    this.serviceRegistry = serviceRegistry;
  }

  identifyMovie(): void {
    if (this.isDetecting) {
      return; // Prevent concurrent executions
    }

    const strategy = this.serviceRegistry.getCurrentStrategy();
    if (!strategy) {
      console.warn(
        "[HTJ MovieDetector] No strategy available for current service"
      );
      return;
    }

    const url = window.location.href;
    const movieId = strategy.getMovieIdFromUrl(url);

    if (!movieId) {
      // Retry later if we cannot read ID yet
      this.scheduleRetry();
      return;
    }

    const idChanged = this.currentMovieId !== movieId;

    // If we already identified and nothing changed and not forcing, bail out
    if (
      !idChanged &&
      !this.isForcingRedetection &&
      this.currentMovieTitle &&
      this.currentMovieYear
    ) {
      return;
    }

    // Update current ID and clear forcing flag
    if (idChanged) {
      this.currentMovieTitle = null;
      this.currentMovieYear = null;
    }
    this.currentMovieId = movieId;
    this.isForcingRedetection = false;

    // 1) Try cache first
    const cached = this.idCache.get(movieId);
    if (cached?.title && cached.year) {
      this.currentMovieTitle = cached.title;
      this.currentMovieYear = cached.year;
      this.emitDetected(cached.title, cached.year);
      return;
    }

    // 2) Fallback to DOM extraction
    this.extractAndEmit(strategy, movieId);
  }

  forceRedetection(): void {
    this.isForcingRedetection = true;
    this.identifyMovie();
  }

  reset(): void {
    this.currentMovieTitle = null;
    this.currentMovieYear = null;
    this.currentMovieId = null;
    this.isForcingRedetection = false;
    this.isDetecting = false;
    if (this.detectionTimer) {
      clearTimeout(this.detectionTimer);
      this.detectionTimer = null;
    }
    // NOTE: keep the cache to speed up revisits within the same tab
  }

  movieIsIdentified(): boolean {
    return !!(
      this.currentMovieId &&
      this.currentMovieTitle &&
      this.currentMovieYear
    );
  }

  private async extractAndEmit(strategy: any, movieId: string): Promise<void> {
    this.isDetecting = true;
    try {
      // Handle both sync and async returns from extractMovieInfo
      const movieInfo = await strategy.extractMovieInfo(movieId);

      if (movieInfo?.title && movieInfo.year) {
        this.currentMovieTitle = movieInfo.title;
        this.currentMovieYear = movieInfo.year;
        this.idCache.set(movieId, {
          title: movieInfo.title,
          year: movieInfo.year,
        });
        this.emitDetected(movieInfo.title, movieInfo.year);
      } else {
        // not ready yet, retry
        this.scheduleRetry();
      }
    } catch (error) {
      console.error("[HTJ MovieDetector] Error extracting movie info:", error);
      this.scheduleRetry();
    } finally {
      this.isDetecting = false; // Reset the flag when done
    }
  }

  private scheduleRetry(): void {
    if (this.detectionTimer) clearTimeout(this.detectionTimer);
    this.detectionTimer = setTimeout(() => this.identifyMovie(), 2000);
  }

  private emitDetected(title: string, year: string | null): void {
    console.log(
      `[HTJ Content] Detected movie: ${title}${
        year ? ` (${year})` : ""
      }. Sending to background.`
    );
    const message: MovieDetectedMessage = {
      type: "MOVIE_DETECTED",
      payload: { title, year },
    };
    chrome.runtime.sendMessage(message).catch((error) => {
      console.error(
        "[HTJ Content] Failed to send movie detection message:",
        error
      );
    });
  }
}
