import type { JumpscareDataMessage } from "../../types/messaging.js";
import { backgroundLogger } from "../../shared/utils/logger.js";
import type { TabStateManager } from "./TabStateManager.js";
import { JumpscareApiService } from "./JumpscareApiService.js";
import type { StrategyMovieInfo } from "../../types/index.js";

export class MovieHandler {
  private tabStateManager: TabStateManager;
  private jumpscareApiService = new JumpscareApiService();

  constructor(tabStateManager: TabStateManager) {
    this.tabStateManager = tabStateManager;
  }

  async handleMovieDetected(
    tabId: number,
    detectedMovie: StrategyMovieInfo
  ): Promise<void> {
    backgroundLogger.log(
      `Received movie detection - Title: ${detectedMovie.title}, Year: ${detectedMovie.year}, Runtime: ${detectedMovie.runtime}, Rating: ${detectedMovie.rating}, Genres: ${detectedMovie.genres}, Directors: ${detectedMovie.directors}`
    );

    const state = await this.tabStateManager.getTabState(tabId);

    // Only fetch if the movie title or year has changed
    if (
      state.movie?.title === detectedMovie.title &&
      state.movie?.year === detectedMovie.year
    ) {
      return;
    }

    const {
      movie: foundMovie,
      jumpscares,
      found,
    } = await this.jumpscareApiService.fetchJumpscares(
      detectedMovie.title!,
      detectedMovie.year
    );

    if (found && foundMovie) {
      state.movie = {
        id: foundMovie.id,
        title: detectedMovie.title || foundMovie.title,
        year: detectedMovie.year || foundMovie.year,
        jumpscares: jumpscares,
        jumpscareCount: jumpscares.length,
        isInDb: true,
        runtime: detectedMovie.runtime || undefined,
        rating: detectedMovie.rating || undefined,
        genres: detectedMovie.genres || foundMovie.genres || undefined,
        directors: detectedMovie.directors || foundMovie.directors || undefined,
      };
    } else {
      // Movie not found in DB => store the detected info from content script
      state.movie = {
        title: detectedMovie.title!,
        year: detectedMovie.year!,
        jumpscares: [],
        jumpscareCount: 0,
        isInDb: false,
        runtime: detectedMovie.runtime || undefined,
        rating: detectedMovie.rating || undefined,
        genres: detectedMovie.genres || undefined,
        directors: detectedMovie.directors || undefined,
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
