import { BackgroundService } from "./modules/BackgroundService.js";
import { MessageHandler } from "./modules/MessageHandler.js";

class ExtensionBackground {
  private backgroundService: BackgroundService;
  private messageHandler: MessageHandler;

  constructor() {
    this.backgroundService = new BackgroundService();
    this.messageHandler = new MessageHandler(this.backgroundService);
    this.init();
  }

  private init(): void {
    console.log("[HTJ Background] Extension background script initialized");
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Handle messages from content scripts and popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      return this.messageHandler.handleMessage(message, sender, sendResponse);
    });

    // Clean up tab state when tabs are closed
    chrome.tabs.onRemoved.addListener((tabId) => {
      this.backgroundService.clearTabState(tabId);
    });
  }
}

new ExtensionBackground();
