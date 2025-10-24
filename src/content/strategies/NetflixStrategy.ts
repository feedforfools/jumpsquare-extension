import type {
  StreamingServiceStrategy,
  MovieInfo,
} from "./StreamingServiceStrategy.js";
import { contentLogger } from "../../shared/utils/logger.js";

export class NetflixStrategy implements StreamingServiceStrategy {
  getServiceName(): string {
    return "Netflix";
  }

  matches(url: string): boolean {
    return url.includes("netflix.com");
  }

  getMovieIdFromUrl(url: string): string | null {
    // Examples:
    // https://www.netflix.com/watch/80100172
    // https://www.netflix.com/browse?jbv=80100172&...
    // https://www.netflix.com/title/80100172
    const watchMatch = url.match(/\/watch\/(\d+)/);
    if (watchMatch && watchMatch[1]) return watchMatch[1];

    const titleMatch = url.match(/\/title\/(\d+)/);
    if (titleMatch && titleMatch[1]) return titleMatch[1];

    const jbvMatch = url.match(/[?&]jbv=(\d+)/);
    if (jbvMatch && jbvMatch[1]) return jbvMatch[1];

    return null;
  }

  isOnMoviePage(url: string): boolean {
    return (
      this.matches(url) && (url.includes("?jbv=") || url.includes("/title/"))
    );
  }

  isInVideoPlayer(url: string): boolean {
    return this.matches(url) && url.includes("/watch/");
  }

  async extractMovieInfo(movieId?: string): Promise<MovieInfo> {
    if (!movieId) {
      movieId = this.getMovieIdFromUrl(window.location.href) || undefined;
    }

    if (!movieId) {
      contentLogger.warn("No movie ID available for extraction");
      return { title: null, year: null };
    }

    return await this.extractFromNetworkRequest(movieId);
  }

  getVideoElement(): HTMLVideoElement | null {
    // TODO: verify if this works in Netflix
    return document.querySelector("video");
  }

  hasVideoPlayerClosed(): boolean {
    // Netflix changes URL away from /watch/ when exiting video player
    return !this.isInVideoPlayer(window.location.href);
  }

  /**
   * Extract metadata by fetching the Netflix API directly
   */
  private async extractFromNetworkRequest(movieId: string): Promise<MovieInfo> {
    contentLogger.log("Fetching metadata from Netflix API for movie", movieId);

    try {
      const apiUrl = `https://www.netflix.com/nq/website/memberapi/release/metadata?movieid=${movieId}`;
      const response = await fetch(apiUrl, {
        credentials: "include", // Include cookies for authentication
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();

      if (data?.video?.title && data?.video?.year) {
        contentLogger.log(
          "Successfully extracted metadata:",
          data.video.title,
          `(${data.video.year})`
        );
        return {
          title: data.video.title,
          year: String(data.video.year),
        };
      }

      contentLogger.warn("API response missing expected video data:", data);
      return { title: null, year: null };
    } catch (error) {
      contentLogger.error("Network request extraction failed:", error);
      return { title: null, year: null };
    }
  }
}
