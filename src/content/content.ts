import { MovieDetector } from "./modules/MovieDetector.ts";
import { VideoTracker } from "./modules/VideoTracker.ts";
import { JumpscareMonitor } from "./modules/JumpscareMonitor.ts";
import { MessageHandler } from "./modules/MessageHandler.ts";
import { TabService } from "../shared/services/tabService.ts";

class ContentScript {
  private movieDetector: MovieDetector;
  private videoTracker: VideoTracker;
  private jumpscareMonitor: JumpscareMonitor;
  private observer!: MutationObserver;
  private currentUrl: string = "";
  private wasOnMoviePage: boolean = false;

  constructor() {
    this.movieDetector = new MovieDetector();
    this.videoTracker = new VideoTracker();
    this.jumpscareMonitor = new JumpscareMonitor();
    new MessageHandler(this.jumpscareMonitor);

    this.setupVideoTracking();
    this.setupDOMObserver();
    this.setupNavigationTracking();
    this.init();
  }

  private setupVideoTracking(): void {
    this.videoTracker.setTimeUpdateCallback((currentTime: number) => {
      this.jumpscareMonitor.checkJumpscares(currentTime);
    });
  }

  private setupNavigationTracking(): void {
    // Track URL changes for SPAs
    this.currentUrl = window.location.href;
    this.wasOnMoviePage = this.isOnMovieOrVideoPage();

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
        this.clearMovieState();
      }
    });
  }

  private handleUrlChange(): void {
    const newUrl = window.location.href;
    if (newUrl !== this.currentUrl) {
      const wasOnMoviePage = this.wasOnMoviePage;
      const isNowOnMoviePage = this.isOnMovieOrVideoPage();

      if (wasOnMoviePage && !isNowOnMoviePage) {
        console.log("[HTJ Content] Left movie page, clearing state");
        this.clearMovieState();
      }

      this.currentUrl = newUrl;
      this.wasOnMoviePage = isNowOnMoviePage;
      this.init();
    }
  }

  private clearMovieState(): void {
    this.jumpscareMonitor.setJumpscares([]);

    chrome.runtime
      .sendMessage({
        type: "CLEAR_MOVIE_STATE",
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
      if (this.currentUrl !== window.location.href) {
        this.handleUrlChange();
      }

      if (TabService.isOnSupportedSite(window.location.href)) {
        this.movieDetector.identifyMovie();
      }

      if (this.isOnMovieOrVideoPage()) {
        this.videoTracker.attachVideoListener();
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  private isOnMovieOrVideoPage(): boolean {
    const currentUrl = window.location.href;
    return (
      TabService.isOnMoviePage(currentUrl) ||
      TabService.isInVideoPlayer(currentUrl)
    );
  }

  private init(): void {
    if (!TabService.isOnSupportedSite(window.location.href)) {
      return;
    }
    this.movieDetector.identifyMovie();

    if (this.isOnMovieOrVideoPage()) {
      this.videoTracker.attachVideoListener();
    }
  }

  cleanup(): void {
    this.observer?.disconnect();
    this.videoTracker.cleanup();

    if (this.wasOnMoviePage) {
      this.clearMovieState();
    }
  }
}

const contentScript = new ContentScript();

window.addEventListener("beforeunload", () => {
  contentScript.cleanup();
});
