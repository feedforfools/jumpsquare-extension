import type { Jumpscare, Movie } from "../../types/index.js";
import {
  JumpscareScheduler,
  type JumpscareEvent,
} from "./JumpscareScheduler.js";
import { NotificationPresenter } from "./NotificationPresenter.js";

export class NotificationOrchestrator {
  private scheduler: JumpscareScheduler;
  private notifications: NotificationPresenter;

  constructor() {
    this.scheduler = new JumpscareScheduler();
    this.notifications = new NotificationPresenter();

    // Connect scheduler to notifications
    this.scheduler.setJumpscareCallback((event: JumpscareEvent) => {
      this.notifications.handleJumpscareEvent(event);
    });

    this.setupEventListeners();
  }

  setJumpscares(jumpscares: Jumpscare[]): void {
    this.scheduler.setJumpscares(jumpscares);
  }

  setMovie(movie: Movie): void {
    this.notifications.setMovie(movie);
  }

  setEnabled(enabled: boolean): void {
    this.notifications.setEnabled(enabled);
  }

  checkJumpscares(currentTime: number): void {
    this.scheduler.processTimeUpdate(currentTime);

    if (currentTime > 0) {
      this.notifications.showWelcomeMessage();
    }
  }

  reset(): void {
    this.scheduler.reset();
    this.notifications.reset();
  }

  private setupEventListeners(): void {
    document.addEventListener("movieChanged", () => {
      this.reset();
    });
  }
}
