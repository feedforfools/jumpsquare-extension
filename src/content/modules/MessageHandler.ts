import type { NotificationOrchestrator } from "./NotificationOrchestrator.js";

export class MessageHandler {
  private notificationOrchestrator: NotificationOrchestrator;

  constructor(notificationOrchestrator: NotificationOrchestrator) {
    this.notificationOrchestrator = notificationOrchestrator;
    this.setupMessageListener();
  }

  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener((message) => {
      switch (message.type) {
        case "JUMPSCARE_DATA":
          console.log(
            `[HTJ Content] Received ${message.payload.jumpscares.length} jumpscares for ${message.payload.movieTitle}`
          );

          // Create movie object from payload
          const movie = {
            title: message.payload.movieTitle,
            year: message.payload.movieYear || null,
            jumpscares: message.payload.jumpscares,
            jumpscareCount: message.payload.jumpscares.length,
            isInDb: message.payload.isInDb,
          };

          this.notificationOrchestrator.setMovie(movie);
          this.notificationOrchestrator.setJumpscares(
            message.payload.jumpscares
          );
          break;

        case "TOGGLE_STATE":
          this.notificationOrchestrator.setEnabled(message.payload.isEnabled);
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
