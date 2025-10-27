import type { JumpscareDataMessage } from "../../types/messaging.js";
import { backgroundLogger } from "../../shared/utils/logger.js";
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
    year: string,
    runtime?: string | null,
    rating?: string | null
  ): Promise<void> {
    backgroundLogger.log(
      `Received movie detection - Title: ${title}, Year: ${year}, Runtime: ${runtime}, Rating: ${rating}`
    );

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
        title: title || foundMovie.title,
        year: year || foundMovie.year,
        jumpscares: jumpscares,
        jumpscareCount: jumpscares.length,
        isInDb: true,
        runtime: runtime || undefined,
        rating: rating || undefined,
        genres: foundMovie.genres,
        directors: foundMovie.directors,
      };
    } else {
      // Movie not found in DB => store the detected info from content script
      state.movie = {
        title: title,
        year: year,
        jumpscares: [],
        jumpscareCount: 0,
        isInDb: false,
        runtime: runtime || undefined,
        rating: rating || undefined,
      };
    }

    await this.tabStateManager.saveTabState(tabId);

    backgroundLogger.log(
      `Loaded ${jumpscares.length} jumpscares for "${state.movie.title}" in tab ${tabId}. Found in DB: ${found}. Sending to content script.`
    );

    // Send jumpscares to content script
    const message: JumpscareDataMessage = {
      type: "JUMPSCARE_DATA",
      payload: {
        jumpscares: jumpscares,
        movieTitle: state.movie.title,
        movieYear: state.movie.year,
        isInDb: state.movie.isInDb,
      },
    };

    try {
      await chrome.tabs.sendMessage(tabId, message);
    } catch (error) {
      backgroundLogger.error(
        `Failed to send jumpscares to tab ${tabId}:`,
        error
      );
    }
  }
}
