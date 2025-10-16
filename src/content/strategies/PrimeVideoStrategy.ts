import type {
  StreamingServiceStrategy,
  MovieInfo,
} from "./StreamingServiceStrategy.js";

export class PrimeVideoStrategy implements StreamingServiceStrategy {
  getServiceName(): string {
    return "Prime Video";
  }

  matches(url: string): boolean {
    return url.includes("primevideo.com");
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

  extractMovieInfo(): MovieInfo {
    const title = this.extractTitle();
    const { year } = this.extractFromBadges();

    return { title, year };
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

  private extractTitle(): string | null {
    const textTitle = this.extractTitleFromText();
    const imageTitle = this.extractTitleFromImage();

    if (textTitle && imageTitle) {
      // If both are found they must match
      return textTitle === imageTitle ? this.cleanTitle(textTitle) : null;
    }

    // If only one is found return it
    const finalTitle = textTitle || imageTitle;
    return finalTitle ? this.cleanTitle(finalTitle) : null;
  }

  private extractTitleFromText(): string | null {
    const titleSelectors = [
      'h1[data-automation-id="title"]',
      ".atvwebplayersdk-title-text",
      '[data-testid="hero-title"]',
      ".av-detail-section h1",
      ".dv-detail-section h1",
      ".av-dp-container .av-badges",
      ".title-wrapper h1",
    ];

    for (const selector of titleSelectors) {
      const titleElement = document.querySelector(selector);
      if (titleElement?.textContent?.trim()) {
        const titleText = titleElement.textContent.trim();
        // Skip if "trailer" appears anywhere in the title (case-insensitive)
        if (/trailer/i.test(titleText)) {
          continue;
        }
        return titleText;
      }
    }
    return null;
  }

  private extractTitleFromImage(): string | null {
    // Titles might also be in image alt attributes when the logo of the movie is used
    const imageTitleElement = document.querySelector(
      'h1[data-testid="title-art"] img[data-testid="base-image"]'
    );
    if (
      imageTitleElement instanceof HTMLImageElement &&
      imageTitleElement.alt
    ) {
      return imageTitleElement.alt;
    }
    return null;
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
