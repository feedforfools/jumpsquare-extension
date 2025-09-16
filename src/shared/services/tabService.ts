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
    return url.includes("primevideo.com");
  }

  static isOnMoviePage(url?: string): boolean {
    if (!url) return false;
    // Prime Video movie/show pages typically have /detail/ in the URL
    return (
      url.includes("primevideo.com") &&
      (url.includes("/detail/") || url.includes("/gp/video/detail/"))
    );
  }

  static isInVideoPlayer(url?: string): boolean {
    if (!url) return false;
    // Prime Video player pages typically have /watch/ in the URL
    return url.includes("primevideo.com") && url.includes("/watch/");
  }

  static getSupportedSiteName(url?: string): string | null {
    if (!url) return null;
    if (url.includes("primevideo.com")) return "Prime Video";
    return null;
  }
}
