import { MovieDetector } from "./modules/MovieDetector.ts";
import { VideoTracker } from "./modules/VideoTracker.ts";
import { NotificationOrchestrator } from "./modules/NotificationOrchestrator.ts";
import { MessageHandler } from "./modules/MessageHandler.ts";
import { ServiceRegistry } from "./strategies/ServiceRegistry.ts";

class ContentScript {
  private serviceRegistry: ServiceRegistry;
  private movieDetector: MovieDetector;
  private videoTracker: VideoTracker;
  private notificationOrchestrator: NotificationOrchestrator;
  private observer!: MutationObserver;
  private currentUrl: string = "";
  private wasOnMoviePage: boolean = false;
  private wasInVideoPlayer: boolean = false;

  constructor() {
    this.serviceRegistry = new ServiceRegistry();
    this.movieDetector = new MovieDetector(this.serviceRegistry);
    this.videoTracker = new VideoTracker(this.serviceRegistry);
    this.notificationOrchestrator = new NotificationOrchestrator();
    new MessageHandler(this.notificationOrchestrator);

    this.setupVideoTracking();
    this.setupDOMObserver();
    this.setupNavigationTracking();
    this.init();
  }

  private setupVideoTracking(): void {
    this.videoTracker.setTimeUpdateCallback((currentTime: number) => {
      this.notificationOrchestrator.checkJumpscares(currentTime);
    });
  }

  private setupNavigationTracking(): void {
    // Track URL changes for SPAs
    this.currentUrl = window.location.href;
    const strategy = this.serviceRegistry.detectService(this.currentUrl);

    this.wasOnMoviePage = strategy
      ? strategy.isOnMoviePage(this.currentUrl) ||
        strategy.isInVideoPlayer(this.currentUrl)
      : false;

    // Listen for pushstate/popstate events (SPA navigation)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      originalPushState.apply(history, args);
      window.dispatchEvent(new Event("urlchange"));
    };

    history.replaceState = function (...args) {
      originalReplaceState.apply(history, args);
      window.dispatchEvent(new Event("urlchange"));
    };

    window.addEventListener("popstate", () => {
      window.dispatchEvent(new Event("urlchange"));
    });

    window.addEventListener("urlchange", () => {
      this.handleUrlChange();
    });

    window.addEventListener("beforeunload", () => {
      if (this.wasOnMoviePage) {
        this.clearTabState();
        this.movieDetector.reset();
      }
    });
  }

  private handleUrlChange(): void {
    const newUrl = window.location.href;
    const strategy = this.serviceRegistry.detectService(newUrl);

    const wasOnMoviePage = this.wasOnMoviePage;
    const isNowOnMoviePage = strategy
      ? strategy.isOnMoviePage(newUrl) || strategy.isInVideoPlayer(newUrl)
      : false;

    console.log(
      `[HTJ Content] URL changed - was: ${wasOnMoviePage}, now: ${isNowOnMoviePage}, URL: ${newUrl}`
    );

    if (wasOnMoviePage && !isNowOnMoviePage) {
      console.log("[HTJ Content] Left movie page, clearing state");
      this.clearTabState();
      this.movieDetector.reset();
    } else if (wasOnMoviePage && isNowOnMoviePage) {
      this.movieDetector.forceRedetection();
    }

    this.currentUrl = newUrl;
    this.wasOnMoviePage = isNowOnMoviePage;
  }

  private clearTabState(): void {
    this.notificationOrchestrator.setJumpscares([]);

    chrome.runtime
      .sendMessage({
        type: "CLEAR_TAB_STATE",
      })
      .catch((error) => {
        console.error(
          "[HTJ Content] Failed to send clear state message:",
          error
        );
      });
  }

  private setupDOMObserver(): void {
    this.observer = new MutationObserver(() => {
      if (!this.serviceRegistry.isOnSupportedSite(window.location.href)) {
        return;
      }

      if (this.currentUrl !== window.location.href) {
        this.handleUrlChange();
      }

      const strategy = this.serviceRegistry.getCurrentStrategy();
      if (!strategy) return;

      if (this.wasInVideoPlayer && strategy.hasVideoPlayerClosed()) {
        this.handleVideoPlayerClosed();
        this.wasInVideoPlayer = false;
        return;
      }

      if (strategy.isOnMoviePage(window.location.href)) {
        this.movieDetector.identifyMovie();
      }

      if (strategy.isInVideoPlayer(window.location.href)) {
        if (!this.movieDetector.movieIsIdentified()) {
          this.movieDetector.identifyMovie();
        }
        if (this.movieDetector.movieIsIdentified()) {
          this.videoTracker.attachVideoListener();
          this.wasInVideoPlayer = true;
        }
      } else {
        this.videoTracker.cleanup();
        this.wasInVideoPlayer = false;
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  private handleVideoPlayerClosed(): void {
    this.videoTracker.cleanup();
    this.notificationOrchestrator.reset();
    console.log("[HTJ Content] Cleaned up after video player closure");
  }

  private init(): void {
    if (!this.serviceRegistry.isOnSupportedSite(window.location.href)) {
      return;
    }

    const strategy = this.serviceRegistry.getCurrentStrategy();
    if (!strategy) return;

    if (strategy.isOnMoviePage(window.location.href)) {
      this.movieDetector.identifyMovie();
    }

    if (strategy.isInVideoPlayer(window.location.href)) {
      if (!this.movieDetector.movieIsIdentified()) {
        this.movieDetector.identifyMovie();
      }
      if (this.movieDetector.movieIsIdentified()) {
        this.videoTracker.attachVideoListener();
      }
    }
  }

  cleanup(): void {
    this.observer?.disconnect();
    this.videoTracker.cleanup();

    if (this.wasOnMoviePage) {
      this.clearTabState();
      this.movieDetector.reset();
    }
  }
}

const contentScript = new ContentScript();

window.addEventListener("beforeunload", () => {
  contentScript.cleanup();
});
