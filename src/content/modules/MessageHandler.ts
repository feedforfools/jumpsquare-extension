import type { JumpscareMonitor } from "./JumpscareMonitor.js";

export class MessageHandler {
  private jumpscareMonitor: JumpscareMonitor;

  constructor(jumpscareMonitor: JumpscareMonitor) {
    this.jumpscareMonitor = jumpscareMonitor;
    this.setupMessageListener();
  }

  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener((message) => {
      switch (message.type) {
        case "JUMPSCARE_DATA":
          console.log(
            `[HTJ Content] Received ${message.payload.jumpscares.length} jumpscares for ${message.payload.movieTitle}`
          );
          this.jumpscareMonitor.setJumpscares(message.payload.jumpscares);
          break;

        case "TOGGLE_STATE":
          this.jumpscareMonitor.setEnabled(message.payload.isEnabled);
          console.log(
            `[HTJ Content] Extension ${
              message.payload.isEnabled ? "enabled" : "disabled"
            }`
          );
          break;
      }
    });
  }
}
