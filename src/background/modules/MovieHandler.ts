import type { JumpscareDataMessage } from "../../types/messaging.js";
import type { TabStateManager } from "./TabStateManager.js";
import { JumpscareApiService } from "./JumpscareApiService.js";

export class MovieHandler {
  private tabStateManager: TabStateManager;
  private jumpscareApiService = new JumpscareApiService();

  constructor(tabStateManager: TabStateManager) {
    this.tabStateManager = tabStateManager;
  }

  async handleMovieDetected(
    tabId: number,
    title: string,
    year: string
  ): Promise<void> {
    const state = await this.tabStateManager.getTabState(tabId);

    if (!state.movie || state.movie.title !== title) {
      if (!state.movie) {
        state.movie = {
          title,
          year,
          jumpscareCount: 0,
          jumpscares: [],
        };
      } else {
        state.movie.title = title;
        state.movie.year = year;
        state.movie.jumpscareCount = 0;
        state.movie.jumpscares = [];
      }

      const jumpscares = await this.jumpscareApiService.fetchJumpscares(
        title,
        year
      );

      state.movie.jumpscares = jumpscares.map((j) => ({
        ...j,
        timeInSeconds: j.timestamp_minutes * 60 + j.timestamp_seconds,
      }));
      state.movie.jumpscareCount = jumpscares.length;

      await this.tabStateManager.saveTabState(tabId);

      console.log(
        `[HTJ Background] Loaded ${jumpscares.length} jumpscares for "${title}" in tab ${tabId}. Sending to content script.`
      );

      // Send jumpscares to content script
      const message: JumpscareDataMessage = {
        type: "JUMPSCARE_DATA",
        payload: {
          jumpscares: jumpscares,
          movieTitle: title,
        },
      };

      try {
        await chrome.tabs.sendMessage(tabId, message);
      } catch (error) {
        console.error(
          `[HTJ Background] Failed to send jumpscares to tab ${tabId}:`,
          error
        );
      }
    }
  }
}
