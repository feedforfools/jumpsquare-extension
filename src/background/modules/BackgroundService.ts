import type { Jumpscare } from "../../types/index.js";
import type { JumpscareDataMessage } from "../../types/messaging.js";

interface JumpscareWithTime extends Jumpscare {
  timeInSeconds: number;
}

interface TabState {
  isEnabled: boolean;
  movieTitle: string | null;
  jumpscares: JumpscareWithTime[];
}

export class BackgroundService {
  private tabStates = new Map<number, TabState>();

  getTabState(tabId: number): TabState {
    if (!this.tabStates.has(tabId)) {
      this.tabStates.set(tabId, {
        isEnabled: true,
        movieTitle: null,
        jumpscares: [],
      });
    }
    return this.tabStates.get(tabId)!;
  }

  cleanupTab(tabId: number): void {
    if (this.tabStates.has(tabId)) {
      this.tabStates.delete(tabId);
      console.log(`[HTJ Background] Cleaned up state for closed tab ${tabId}`);
    }
  }

  async fetchJumpscares(
    title: string,
    year: string | null
  ): Promise<JumpscareWithTime[]> {
    console.log(`[HTJ Background] Fetching jumpscares for: ${title}`);
    const apiBaseUrl = "http://localhost:3000"; // TODO: Use production URL
    const params = new URLSearchParams({ title });
    if (year) params.append("year", year);

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/extension/jumpscares?${params.toString()}`
      );
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      const data = await response.json();
      return (data.jumpscares || [])
        .map((j: Jumpscare) => ({
          ...j,
          timeInSeconds: j.timestamp_minutes * 60 + j.timestamp_seconds,
        }))
        .sort(
          (a: JumpscareWithTime, b: JumpscareWithTime) =>
            a.timeInSeconds - b.timeInSeconds
        );
    } catch (error) {
      console.error("[HTJ Background] Failed to fetch jumpscares:", error);
      return [];
    }
  }

  async handleMovieDetected(
    tabId: number,
    title: string,
    year: string | null
  ): Promise<void> {
    const state = this.getTabState(tabId);

    if (state.movieTitle !== title) {
      state.movieTitle = title;
      // Reset jumpscare info for the new movie
      state.jumpscares = [];

      const jumpscares = await this.fetchJumpscares(title, year);
      state.jumpscares = jumpscares;

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

  handleToggleState(tabId: number, isEnabled: boolean): void {
    const state = this.getTabState(tabId);
    state.isEnabled = isEnabled;
    console.log(
      `[HTJ Background] Tab ${tabId} state toggled to: ${
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
