import { ServiceRegistry } from '../../content/strategies/ServiceRegistry.js';

export class TabService {
  private static serviceRegistry = new ServiceRegistry();

  static async getCurrentTab(): Promise<chrome.tabs.Tab | null> {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      return tab || null;
    } catch (error) {
      console.error('Error getting current tab:', error);
      return null;
    }
  }

  static async openUrl(url: string): Promise<void> {
    try {
      await chrome.tabs.create({ url });
    } catch (error) {
      console.error('Error opening URL:', error);
    }
  }

  static isOnSupportedSite(url?: string): boolean {
    if (!url) return false;
    return this.serviceRegistry.isOnSupportedSite(url);
  }

  static isOnMoviePage(url?: string): boolean {
    if (!url) return false;
    const strategy = this.serviceRegistry.detectService(url);
    return strategy ? strategy.isOnMoviePage(url) : false;
  }

  static isInVideoPlayer(url?: string): boolean {
    if (!url) return false;
    const strategy = this.serviceRegistry.detectService(url);
    return strategy ? strategy.isInVideoPlayer(url) : false;
  }

  static getSupportedSiteName(url?: string): string | null {
    if (!url) return null;
    const strategy = this.serviceRegistry.detectService(url);
    return strategy ? strategy.getServiceName() : null;
  }
}
