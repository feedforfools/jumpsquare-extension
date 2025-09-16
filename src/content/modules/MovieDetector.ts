import type { MovieDetectedMessage } from "../../types/messaging.js";

export class MovieDetector {
  private currentMovieTitle: string | null = null;

  getCurrentMovie(): string | null {
    return this.currentMovieTitle;
  }

  identifyMovie(): void {
    const titleElement = document.querySelector(
      'h1[data-automation-id="title"], .atvwebplayersdk-title-text'
    );
    const metadataContainer = document.querySelector(
      ".atvwebplayersdk-info-container"
    );

    const title = titleElement?.textContent?.trim() || null;

    if (title && title !== this.currentMovieTitle) {
      this.currentMovieTitle = title;

      let year: string | null = null;
      if (metadataContainer?.textContent) {
        const yearRegex = /\b(19\d\d|20\d\d)\b/;
        const match = metadataContainer.textContent.match(yearRegex);
        if (match) year = match[0];
      }

      console.log(
        `[HTJ Content] Detected movie: ${title}. Sending to background.`
      );

      const message: MovieDetectedMessage = {
        type: "MOVIE_DETECTED",
        payload: { title, year },
      };

      chrome.runtime.sendMessage(message);

      // Emit custom event for other modules to listen to
      document.dispatchEvent(
        new CustomEvent("movieChanged", {
          detail: { title, year },
        })
      );
    }
  }
}
