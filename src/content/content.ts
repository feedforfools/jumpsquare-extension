import { MovieDetector } from "./modules/MovieDetector.ts";
import { VideoTracker } from "./modules/VideoTracker.ts";
import { NotificationOrchestrator } from "./modules/NotificationOrchestrator.ts";
import { MessageHandler } from "./modules/MessageHandler.ts";
import { TabService } from "../shared/services/tabService.ts";

class ContentScript {
  private movieDetector: MovieDetector;
  private videoTracker: VideoTracker;
  private notificationOrchestrator: NotificationOrchestrator;
  private observer!: MutationObserver;
  private currentUrl: string = "";
  private wasOnMoviePage: boolean = false;

  constructor() {
    this.movieDetector = new MovieDetector();
    this.videoTracker = new VideoTracker();
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
    this.wasOnMoviePage =
      TabService.isOnMoviePage(this.currentUrl) ||
      TabService.isInVideoPlayer(this.currentUrl);

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
    if (newUrl !== this.currentUrl) {
      const wasOnMoviePage = this.wasOnMoviePage;
      const isNowOnMoviePage =
        TabService.isOnMoviePage(newUrl) || TabService.isInVideoPlayer(newUrl);

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
      if (!TabService.isOnSupportedSite(window.location.href)) {
        return;
      }

      if (this.currentUrl !== window.location.href) {
        this.handleUrlChange();
      }

      if (TabService.isOnMoviePage(window.location.href)) {
        this.movieDetector.identifyMovie();
      }

      if (TabService.isInVideoPlayer(window.location.href)) {
        if (!this.movieDetector.movieIsIdentified()) {
          this.movieDetector.identifyMovie();
        }
        if (this.movieDetector.movieIsIdentified()) {
          this.videoTracker.attachVideoListener();
        }
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  private init(): void {
    if (!TabService.isOnSupportedSite(window.location.href)) {
      return;
    }

    if (TabService.isOnMoviePage(window.location.href)) {
      this.movieDetector.identifyMovie();
    }

    if (TabService.isInVideoPlayer(window.location.href)) {
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
