import type { MovieDetectedMessage } from "../../types/messaging.js";
import type { ServiceRegistry } from "../strategies/ServiceRegistry.js";
import { contentLogger } from "../../shared/utils/logger.js";
import type { StrategyMovieInfo } from "../../types/index.js";

export class MovieDetector {
  private currentMovie: StrategyMovieInfo | null = null;
  private currentMovieId: string | null = null;
  private isForcingRedetection: boolean = false;
  private isDetecting: boolean = false;
  private detectionTimer: ReturnType<typeof setTimeout> | null = null;
  private serviceRegistry: ServiceRegistry;

  // Simple in-memory cache => survives SPA nav within same tab
  private idCache = new Map<string, StrategyMovieInfo>();

  constructor(serviceRegistry: ServiceRegistry) {
    this.serviceRegistry = serviceRegistry;
  }

  identifyMovie(): void {
    if (this.isDetecting) {
      return; // Prevent concurrent executions
    }

    const strategy = this.serviceRegistry.getCurrentStrategy();
    if (!strategy) {
      contentLogger.warn("No strategy available for current service");
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
    if (!idChanged && !this.isForcingRedetection && this.currentMovie) {
      return;
    }

    // Update current ID and clear forcing flag
    if (idChanged) {
      this.currentMovie = null;
    }
    this.currentMovieId = movieId;
    this.isForcingRedetection = false;

    // 1) Try cache first
    const cached = this.idCache.get(movieId);
    if (cached?.title && cached.year) {
      this.currentMovie = cached;
      this.emitDetected(cached);
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
    this.currentMovie = null;
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
      this.currentMovie &&
      this.currentMovie.title &&
      this.currentMovie.year
    );
  }

  private async extractAndEmit(strategy: any, movieId: string): Promise<void> {
    this.isDetecting = true;
    try {
      // Handle both sync and async returns from extractMovieInfo
      const movieInfo = await strategy.extractMovieInfo(movieId);

      if (movieInfo?.title && movieInfo.year) {
        this.currentMovie = movieInfo;
        this.idCache.set(movieId, movieInfo);
        this.emitDetected(movieInfo);
      } else {
        // not ready yet, retry
        this.scheduleRetry();
      }
    } catch (error) {
      contentLogger.error("Error extracting movie info:", error);
      this.scheduleRetry();
    } finally {
      this.isDetecting = false; // Reset the flag when done
    }
  }

  private scheduleRetry(): void {
    if (this.detectionTimer) clearTimeout(this.detectionTimer);
    this.detectionTimer = setTimeout(() => this.identifyMovie(), 2000);
  }

  private emitDetected(movie: StrategyMovieInfo): void {
    const message: MovieDetectedMessage = {
      type: "MOVIE_DETECTED",
      payload: movie,
    };
    chrome.runtime.sendMessage(message).catch((error) => {
      contentLogger.error("Failed to send movie detection message:", error);
    });
  }
}
