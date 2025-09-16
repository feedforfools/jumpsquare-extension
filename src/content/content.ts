import { MovieDetector } from "./modules/MovieDetector.ts";
import { VideoTracker } from "./modules/VideoTracker.ts";
import { JumpscareMonitor } from "./modules/JumpscareMonitor.ts";
import { MessageHandler } from "./modules/MessageHandler.ts";

class ContentScript {
  private movieDetector: MovieDetector;
  private videoTracker: VideoTracker;
  private jumpscareMonitor: JumpscareMonitor;
  private observer!: MutationObserver;

  constructor() {
    this.movieDetector = new MovieDetector();
    this.videoTracker = new VideoTracker();
    this.jumpscareMonitor = new JumpscareMonitor();
    new MessageHandler(this.jumpscareMonitor);

    this.setupVideoTracking();
    this.setupDOMObserver();
    this.init();
  }

  private setupVideoTracking(): void {
    this.videoTracker.setTimeUpdateCallback((currentTime: number) => {
      this.jumpscareMonitor.checkJumpscares(currentTime);
    });
  }

  private setupDOMObserver(): void {
    this.observer = new MutationObserver(() => {
      this.movieDetector.identifyMovie();
      this.videoTracker.attachVideoListener();
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  private init(): void {
    // Initial run
    this.movieDetector.identifyMovie();
    this.videoTracker.attachVideoListener();
  }

  cleanup(): void {
    this.observer?.disconnect();
    this.videoTracker.cleanup();
  }
}

// Initialize the content script
const contentScript = new ContentScript();

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  contentScript.cleanup();
});
