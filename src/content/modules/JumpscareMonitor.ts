import type { Jumpscare } from "../../types/index.js";
import {
  JumpscareScheduler,
  type JumpscareEvent,
} from "./JumpscareScheduler.js";
import { JumpscareDisplayManager } from "./JumpscareDisplayManager.js";

export class JumpscareMonitor {
  private scheduler: JumpscareScheduler;
  private displayManager: JumpscareDisplayManager;

  constructor() {
    this.scheduler = new JumpscareScheduler();
    this.displayManager = new JumpscareDisplayManager();

    // Connect scheduler to display manager
    this.scheduler.setJumpscareCallback((event: JumpscareEvent) => {
      this.displayManager.handleJumpscareEvent(event);
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    document.addEventListener("movieChanged", () => {
      this.reset();
    });
  }

  setJumpscares(jumpscares: Jumpscare[]): void {
    this.scheduler.setJumpscares(jumpscares);
  }

  setEnabled(enabled: boolean): void {
    this.displayManager.setEnabled(enabled);
  }

  checkJumpscares(currentTime: number): void {
    this.scheduler.processTimeUpdate(currentTime);
  }

  private reset(): void {
    this.scheduler.reset();
  }
}
