import type { MovieDetectedMessage } from "../../types/messaging.js";

export class MovieDetector {
  private currentMovieTitle: string | null = null;
  private currentMovieYear: string | null = null;
  private isForcingRedetection: boolean = false;

  private detectionTimer: ReturnType<typeof setTimeout> | null = null;

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

    const movieInfo = this.extractMovieInfo();

    if (
      movieInfo &&
      movieInfo.title &&
      movieInfo.year &&
      (movieInfo.title !== this.currentMovieTitle ||
        movieInfo.year !== this.currentMovieYear)
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

  private extractMovieInfo(): { title: string | null; year: string | null } {
    const title = this.extractTitle();
    const badgesInfo = this.extractFromBadges();

    return {
      title: title,
      year: badgesInfo.year,
    };
  }

  private extractTitle(): string | null {
    // Get title from various possible selectors
    const titleSelectors = [
      'h1[data-automation-id="title"]',
      ".atvwebplayersdk-title-text",
      '[data-testid="hero-title"]',
      ".av-detail-section h1",
      ".dv-detail-section h1",
      ".av-dp-container h1",
      ".title-wrapper h1",
    ];

    let rawTitle: string | null = null;
    for (const selector of titleSelectors) {
      const titleElement = document.querySelector(selector);
      if (titleElement?.textContent?.trim()) {
        rawTitle = titleElement.textContent.trim();
        break;
      }
    }

    // Titles might also be in image alt attributes when the logo of the movie is used
    if (!rawTitle) {
      const imageTitleElement = document.querySelector(
        'h1[data-testid="title-art"] img[data-testid="base-image"]'
      );
      if (
        imageTitleElement instanceof HTMLImageElement &&
        imageTitleElement.alt
      ) {
        rawTitle = imageTitleElement.alt;
      }
    }

    if (!rawTitle) {
      return null;
    }

    const cleanTitle = this.cleanTitle(rawTitle);
    return cleanTitle;
  }

  private cleanTitle(rawTitle: string): string {
    // Remove parenthetical year information like "Movie Title (1999)"
    const titleWithoutYear = rawTitle.replace(
      /\s*\(\s*(?:19|20)\d{2}(?:[^)]*)\)\s*$/g,
      ""
    );
    return titleWithoutYear.trim();
  }

  private extractFromBadges(): {
    year: string | null;
    duration: string | null;
  } {
    // Look for the badges container
    const badgesSelectors = [
      ".dv-node-dp-badges",
      ".av-detail-section .av-badges",
      ".dv-detail-section .av-badges",
      ".av-dp-container .av-badges",
    ];

    let badgesContainer: Element | null = null;
    for (const selector of badgesSelectors) {
      badgesContainer = document.querySelector(selector);
      if (badgesContainer) break;
    }

    if (!badgesContainer) {
      return { year: null, duration: null };
    }

    // Extract year from release year badge
    let year: string | null = null;
    const yearBadge = badgesContainer.querySelector(
      '[data-automation-id="release-year-badge"]'
    );
    if (yearBadge?.textContent) {
      const yearMatch = yearBadge.textContent.match(/\b(19\d\d|20\d\d)\b/);
      if (yearMatch) {
        year = yearMatch[0];
      }
    }

    // Extract duration from runtime badge
    let duration: string | null = null;
    const runtimeBadge = badgesContainer.querySelector(
      '[data-automation-id="runtime-badge"]'
    );
    if (runtimeBadge?.textContent) {
      // Runtime can be in formats like "2h", "1h 30min", "90min"
      const runtimeText = runtimeBadge.textContent.trim();
      if (runtimeText) {
        duration = runtimeText;
      }
    }

    return { year, duration };
  }
}
