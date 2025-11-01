import type { StreamingServiceStrategy } from "./StreamingServiceStrategy.js";
import type { StrategyMovieInfo } from "../../types/index.js";
import { contentLogger } from "../../shared/utils/logger.js";

export class PrimeVideoStrategy implements StreamingServiceStrategy {
  getServiceName(): string {
    return "Prime Video";
  }

  matches(url: string): boolean {
    return url.includes("primevideo.com");
  }

  getMovieIdFromUrl(url: string): string | null {
    // Examples:
    // https://www.primevideo.com/detail/0GQF.../
    // https://www.primevideo.com/gp/video/detail/0GQF.../?...
    const detailRegex = /\/detail\/([^/?#]+)/;
    const gpDetailRegex = /\/gp\/video\/detail\/([^/?#]+)/;

    const m1 = url.match(detailRegex);
    if (m1 && m1[1]) return m1[1];

    const m2 = url.match(gpDetailRegex);
    if (m2 && m2[1]) return m2[1];

    return null;
  }

  isOnMoviePage(url: string): boolean {
    return url.includes("/detail/") || url.includes("/gp/video/detail/");
  }

  isInVideoPlayer(url: string): boolean {
    if (!this.isOnMoviePage(url)) return false;

    // 1. Find the active player container in fullscreen-like view
    const activePlayerContainer = document.querySelector(
      "[id^='dv-web-player'].dv-player-fullscreen"
    );

    if (!activePlayerContainer) {
      return false; // Player is not open in the large view
    }

    // 2. Find the dedicated title element within the active player
    const titleElement = activePlayerContainer.querySelector(
      ".atvwebplayersdk-title-text"
    );

    if (!titleElement) {
      return false; // No title element means it's not the main movie
    }

    // 3. Check if title has actual text content
    const titleText = (titleElement.textContent || "").trim();

    if (!titleText) {
      return false; // Empty title means it's not the main movie (likely a trailer)
    }

    // 4. Check if "trailer" appears anywhere in the title (case-insensitive)
    if (/trailer/i.test(titleText)) {
      return false; // It's a trailer
    }

    // If we have a non-empty title that's not a trailer, it's the movie
    return true;
  }

  async extractMovieInfo(): Promise<StrategyMovieInfo> {
    // Fetch and parse the page content via network request
    const fromNetwork = await this.fetchAndParsePage();
    if (fromNetwork.title && fromNetwork.year) {
      contentLogger.log(
        "Extracted movie info from fetched page content",
        fromNetwork
      );
    } else {
      contentLogger.warn(
        "Failed to extract movie info from fetched page content."
      );
    }
    return fromNetwork;
  }

  private async fetchAndParsePage(): Promise<StrategyMovieInfo> {
    try {
      const response = await fetch(window.location.href, {
        method: "GET",
        headers: {
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        },
        credentials: "omit", // Cookies are handled by the browser automatically
      });

      if (!response.ok) {
        throw new Error(
          `Network request failed with status ${response.status}`
        );
      }

      const htmlText = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, "text/html");

      return this.extractFromPageData(doc);
    } catch (error) {
      contentLogger.error("Error fetching or parsing page content:", error);
      return {
        title: null,
        year: null,
        runtime: null,
        rating: null,
        genres: null,
        directors: null,
      };
    }
  }

  private extractFromPageData(scope: Document = document): StrategyMovieInfo {
    try {
      const scriptElements = scope.querySelectorAll(
        'div#a-page script[type="text/template"]'
      );

      if (scriptElements.length === 0) {
        contentLogger.warn("No script[type='text/template'] found in scope.");
        return {
          title: null,
          year: null,
          runtime: null,
          rating: null,
          genres: null,
          directors: null,
        };
      }

      for (const scriptElement of scriptElements) {
        if (!scriptElement?.textContent) {
          continue;
        }

        const data = JSON.parse(scriptElement.textContent);
        const pageData = data?.props?.body?.[0]?.props;

        if (!pageData) {
          continue;
        }

        const pageTitleId = pageData.atf?.state?.pageTitleId;
        const movieData =
          pageData.atf?.state?.detail?.headerDetail?.[pageTitleId];

        // If we found the movie data in this script, extract and return it
        if (movieData?.title && movieData.releaseYear) {
          const title = this.decodeHtmlEntities(movieData.title);
          const year = movieData.releaseYear
            ? String(movieData.releaseYear)
            : null;

          // Convert Prime Video runtime format to minutes only
          let runtime: string | null = null;
          if (movieData.runtime) {
            runtime = this.convertRuntimeToMinutes(movieData.runtime);
          }

          const rating = movieData.ratingBadge?.displayText || null;
          const genres =
            movieData.genres
              ?.map((g: { text: string }) => g.text)
              .filter(Boolean) || null;
          const directors =
            movieData.contributors?.directors
              ?.map((d: { name: string }) => d.name)
              .filter(Boolean) || null;

          return { title, year, runtime, rating, genres, directors };
        }
      }

      // If the loop completes, no script contained the movie data
      return {
        title: null,
        year: null,
        runtime: null,
        rating: null,
        genres: null,
        directors: null,
      };
    } catch (error) {
      contentLogger.error("Error parsing page data JSON:", error);
      return {
        title: null,
        year: null,
        runtime: null,
        rating: null,
        genres: null,
        directors: null,
      };
    }
  }

  private convertRuntimeToMinutes(runtime: string): string | null {
    if (!runtime) return null;

    // Match patterns like "1 h 45 min", "2 h 30 min", "90 min"
    const hoursMatch = runtime.match(/(\d+)\s*h/);
    const minutesMatch = runtime.match(/(\d+)\s*min/);

    const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
    const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;

    const totalMinutes = hours * 60 + minutes;

    return totalMinutes > 0 ? String(totalMinutes) : null;
  }

  private decodeHtmlEntities(text: string): string | null {
    if (!text) return null;
    const textarea = document.createElement("textarea");
    textarea.innerHTML = text;
    return textarea.value;
  }

  getVideoElement(): HTMLVideoElement | null {
    // When in video player, find video within the active player container
    const activePlayerContainer = document.querySelector(
      "[id^='dv-web-player'].dv-player-fullscreen"
    );

    if (!activePlayerContainer) {
      return null;
    }

    return activePlayerContainer.querySelector("video");
  }

  hasVideoPlayerClosed(): boolean {
    // Check if the fullscreen player container exists
    const activePlayerContainer = document.querySelector(
      "[id^='dv-web-player'].dv-player-fullscreen"
    );

    return activePlayerContainer === null;
  }

  getDisplayedVideoTime(): number | null {
    const activePlayerContainer = document.querySelector(
      "[id^='dv-web-player'].dv-player-fullscreen"
    );

    if (!activePlayerContainer) return null;

    // Get Prime Video's time display element
    const timeDisplay = activePlayerContainer.querySelector(
      ".atvwebplayersdk-timeindicator-text"
    );

    if (!timeDisplay?.textContent) return null;

    // Parse the displayed time (e.g., "0:38:54 / 1:13:43")
    // Split by " / " and take the first part (current time)
    const displayedTime = timeDisplay.textContent.split(" / ")[0];

    return this.parseTimeToSeconds(displayedTime);
  }

  private parseTimeToSeconds(timeStr: string): number | null {
    if (!timeStr || timeStr === "N/A") return null;

    const parts = timeStr.split(":").map((p) => parseInt(p, 10));

    if (parts.length === 2) {
      // MM:SS format
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      // H:MM:SS format
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }

    return null;
  }
}
