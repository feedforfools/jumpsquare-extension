import type { BackgroundService } from "./BackgroundService.js";

export class MessageHandler {
  private backgroundService: BackgroundService;

  constructor(backgroundService: BackgroundService) {
    this.backgroundService = backgroundService;
  }

  handleMessage(
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ): boolean {
    const tabId = sender.tab?.id;

    switch (message.type) {
      case "MOVIE_DETECTED":
        if (!tabId) break;

        this.backgroundService.handleMovieDetected(
          tabId,
          message.payload.title,
          message.payload.year
        );
        break;

      case "CLEAR_MOVIE_STATE":
        if (!tabId) break;

        this.backgroundService.clearMovieState(tabId);
        break;

      case "GET_TAB_STATE": // Handle this async case separately
        // For popup requests get the tab ID from the message payload
        const requestedTabId = message.tabId;
        if (!requestedTabId) {
          console.error(
            "[HTJ Background] No tab ID provided in GET_TAB_STATE request"
          );
          sendResponse(null);
          return true;
        }

        this.backgroundService
          .getTabState(requestedTabId)
          .then((state) => {
            sendResponse(state);
          })
          .catch((error) => {
            console.error(`[HTJ Background] Error getting tab state:`, error);
            sendResponse(null);
          });
        return true; // Keep message channel open for async response

      case "TOGGLE_STATE":
        if (!tabId) break;

        this.backgroundService.handleToggleState(
          tabId,
          message.payload.isEnabled
        );
        break;
    }

    return false;
  }
}
