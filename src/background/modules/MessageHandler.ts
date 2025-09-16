import type { BackgroundService } from "./BackgroundService.js";

export class MessageHandler {
  private backgroundService: BackgroundService;

  constructor(backgroundService: BackgroundService) {
    this.backgroundService = backgroundService;
  }

  async handleMessage(
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ): Promise<boolean> {
    const tabId = sender.tab?.id;
    if (!tabId) return false; // Ignore messages without a tab ID

    switch (message.type) {
      case "MOVIE_DETECTED":
        await this.backgroundService.handleMovieDetected(
          tabId,
          message.payload.title,
          message.payload.year
        );
        break;

      case "GET_TAB_STATE":
        const state = this.backgroundService.getTabState(tabId);
        console.log(
          `[HTJ Background] Popup requested state for tab ${tabId}. Sending:`,
          state
        );
        sendResponse(state);
        return true; // Indicates async response

      case "TOGGLE_STATE":
        this.backgroundService.handleToggleState(
          tabId,
          message.payload.isEnabled
        );
        break;
    }

    return false;
  }
}
