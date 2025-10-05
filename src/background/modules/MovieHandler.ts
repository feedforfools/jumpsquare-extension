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

    // Only fetch if the movie title or year has changed
    if (state.movie?.title === title && state.movie?.year === year) {
      return;
    }

    const {
      movie: foundMovie,
      jumpscares,
      found,
    } = await this.jumpscareApiService.fetchJumpscares(title, year);

    if (found && foundMovie) {
      state.movie = {
        id: foundMovie.id,
        title: foundMovie.title,
        year: foundMovie.year,
        jumpscares: jumpscares,
        jumpscareCount: jumpscares.length,
        isInDb: true,
      };
    } else {
      // Movie not found in DB, store the detected info
      state.movie = {
        title: title,
        year: year,
        jumpscares: [],
        jumpscareCount: 0,
        isInDb: false,
      };
    }

    await this.tabStateManager.saveTabState(tabId);

    console.log(
      `[HTJ Background] Loaded ${jumpscares.length} jumpscares for "${state.movie.title}" in tab ${tabId}. Found in DB: ${found}. Sending to content script.`
    );

    // Send jumpscares to content script
    const message: JumpscareDataMessage = {
      type: "JUMPSCARE_DATA",
      payload: {
        jumpscares: jumpscares,
        movieTitle: state.movie.title,
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
