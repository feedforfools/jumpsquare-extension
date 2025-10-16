import type {
  StreamingServiceStrategy,
  MovieInfo,
} from "./StreamingServiceStrategy.js";

export class NetflixStrategy implements StreamingServiceStrategy {
  getServiceName(): string {
    return "Netflix";
  }

  matches(url: string): boolean {
    return url.includes("netflix.com");
  }

  isOnMoviePage(url: string): boolean {
    return url.includes("/browse/") && url.includes("?jbv=");
  }

  isInVideoPlayer(url: string): boolean {
    return url.includes("/watch/");
  }

  extractMovieInfo(): MovieInfo {
    // Netflix-specific extraction logic
    const title = this.extractTitle();
    const year = this.extractYear();

    return { title, year };
  }

  getVideoElement(): HTMLVideoElement | null {
    // TODO: verify if this works in Netflix
    return document.querySelector("video");
  }

  hasVideoPlayerClosed(): boolean {
    // Netflix uses URL changes => we rely on URL-based detection
    return false;
  }

  private extractTitle(): string | null {
    // Netflix-specific title selectors
    // TODO: verify and improve these selectors
    const titleSelectors = [
      ".title-title",
      '[data-uia="video-title"]',
      ".previewModal--player-titleTreatment-logo",
    ];

    for (const selector of titleSelectors) {
      const titleElement = document.querySelector(selector);
      if (titleElement?.textContent?.trim()) {
        return titleElement.textContent.trim();
      }
    }

    // Try getting from page title as fallback
    const pageTitle = document.title;
    if (pageTitle && pageTitle !== "Netflix") {
      return pageTitle.replace(" - Netflix", "").trim();
    }

    return null;
  }

  private extractYear(): string | null {
    // Netflix-specific year extraction
    // TODO: verify and improve these selectors
    const metadataSelectors = [
      ".videoMetadata--first-line",
      ".preview-modal-metadata",
    ];

    for (const selector of metadataSelectors) {
      const metadataElement = document.querySelector(selector);
      if (metadataElement?.textContent) {
        const yearMatch =
          metadataElement.textContent.match(/\b(19\d\d|20\d\d)\b/);
        if (yearMatch) {
          return yearMatch[0];
        }
      }
    }

    return null;
  }
}
