import type { MovieDetectedMessage } from "../../types/messaging.js";

export class MovieDetector {
  private currentMovieTitle: string | null = null;
  private detectionTimer: ReturnType<typeof setTimeout> | null = null;

  getCurrentMovie(): string | null {
    return this.currentMovieTitle;
  }

  identifyMovie(): void {
    if (this.detectionTimer) {
      clearTimeout(this.detectionTimer);
    }

    // Possible selectors for movie title on various streaming sites
    const titleSelectors = [
      'h1[data-automation-id="title"]',
      ".atvwebplayersdk-title-text",
      '[data-testid="hero-title"]',
      ".av-detail-section h1",
      ".dv-detail-section h1",
      ".av-dp-container h1",
      ".title-wrapper h1",
    ];

    let titleElement: Element | null = null;
    for (const selector of titleSelectors) {
      titleElement = document.querySelector(selector);
      if (titleElement) break;
    }

    const title = titleElement?.textContent?.trim() || null;

    if (title && title !== this.currentMovieTitle) {
      this.currentMovieTitle = title;

      // Extract year from various possible locations
      let year: string | null = null;
      const yearSelectors = [
        ".atvwebplayersdk-info-container",
        '[data-testid="hero-metadata"]',
        ".av-detail-section .av-badges",
        ".dv-detail-section .av-badges",
        ".av-dp-container .av-badges",
      ];

      for (const selector of yearSelectors) {
        const metadataContainer = document.querySelector(selector);
        if (metadataContainer?.textContent) {
          const yearRegex = /\b(19\d\d|20\d\d)\b/;
          const match = metadataContainer.textContent.match(yearRegex);
          if (match) {
            year = match[0];
            break;
          }
        }
      }

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

      // Emit custom event for other modules to listen to
      document.dispatchEvent(
        new CustomEvent("movieChanged", {
          detail: { title, year },
        })
      );
    } else if (!title) {
      this.detectionTimer = setTimeout(() => {
        this.identifyMovie();
      }, 2000);
    }
  }
}
