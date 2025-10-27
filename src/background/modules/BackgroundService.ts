import type { StrategyMovieInfo, TabState } from "../../types/index.js";
import { backgroundLogger } from "../../shared/utils/logger.js";
import { MovieHandler } from "./MovieHandler.js";
import { TabStateManager } from "./TabStateManager.js";

export class BackgroundService {
  private tabStateManager = new TabStateManager();
  private movieHandler = new MovieHandler(this.tabStateManager);

  async getTabState(tabId: number): Promise<TabState | null> {
    return await this.tabStateManager.getTabState(tabId);
  }

  async handleMovieDetected(
    tabId: number,
    movie: StrategyMovieInfo
  ): Promise<void> {
    await this.movieHandler.handleMovieDetected(tabId, movie);
  }

  async clearTabState(tabId: number): Promise<void> {
    await this.tabStateManager.clearTabState(tabId);
  }

  async handleToggleState(tabId: number, isEnabled: boolean): Promise<void> {
    const state = await this.tabStateManager.getTabState(tabId);
    state.isEnabled = isEnabled;
    backgroundLogger.log(
      `Tab ${tabId} state toggled to: ${
        state.isEnabled ? "Enabled" : "Disabled"
      }`
    );

    // Send toggle state to content script
    chrome.tabs.sendMessage(tabId, {
      type: "TOGGLE_STATE",
      payload: { isEnabled },
    });
  }
}
