export class TabService {
  static async getCurrentTab(): Promise<chrome.tabs.Tab | null> {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      return tab || null;
    } catch (error) {
      console.error("Error getting current tab:", error);
      return null;
    }
  }

  static async openUrl(url: string): Promise<void> {
    try {
      await chrome.tabs.create({ url });
    } catch (error) {
      console.error("Error opening URL:", error);
    }
  }

  static isOnSupportedSite(url?: string): boolean {
    if (!url) return false;
    return url.includes("primevideo.com") || url.includes("netflix.com");
  }

  static isOnMoviePage(url?: string): boolean {
    if (!url) return false;

    // Prime Video
    if (
      url.includes("primevideo.com") &&
      (url.includes("/detail/") || url.includes("/gp/video/detail/"))
    ) {
      return true;
    }

    // Netflix
    if (
      url.includes("netflix.com") &&
      url.includes("/browse/") &&
      url.includes("?jbv=")
    ) {
      return true;
    }

    return false;
  }

  static isInVideoPlayer(url?: string): boolean {
    if (!url) return false;

    // Prime Video => no link change when in player
    // TODO: needs a detection mechanism based on some other criteria (player DOM element?)
    if (url.includes("primevideo.com")) {
      return false;
    }

    // Netflix
    if (url.includes("netflix.com") && url.includes("/watch/")) {
      return true;
    }

    return false;
  }

  static getSupportedSiteName(url?: string): string | null {
    if (!url) return null;
    if (url.includes("primevideo.com")) return "Prime Video";
    if (url.includes("netflix.com")) return "Netflix";
    return null;
  }
}
