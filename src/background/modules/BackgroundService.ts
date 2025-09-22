import type { Jumpscare, TabState } from "../../types/index.js";
import type { JumpscareDataMessage } from "../../types/messaging.js";

export class BackgroundService {
  private tabStates = new Map<number, TabState>();

  // Add persistence methods
  private async saveTabState(tabId: number): Promise<void> {
    const state = await this.getTabState(tabId);
    await chrome.storage.session.set({
      [`tab_${tabId}`]: state,
    });
    console.log(
      `[HTJ Background] Saved state for tab ${tabId} to session storage`
    );
  }

  private async loadTabState(tabId: number): Promise<TabState | null> {
    try {
      const result = await chrome.storage.session.get(`tab_${tabId}`);
      const savedState = result[`tab_${tabId}`];
      if (savedState) {
        // Validate that the saved state has the expected structure
        const validatedState: TabState = {
          isEnabled:
            typeof savedState.isEnabled === "boolean"
              ? savedState.isEnabled
              : true,
          movieTitle:
            typeof savedState.movieTitle === "string"
              ? savedState.movieTitle
              : null,
          jumpscares: Array.isArray(savedState.jumpscares)
            ? savedState.jumpscares
            : [],
        };
        console.log(
          `[HTJ Background] Loaded and validated state for tab ${tabId} from session storage`
        );
        return validatedState;
      }
    } catch (error) {
      console.error(
        `[HTJ Background] Failed to load state for tab ${tabId}:`,
        error
      );
    }
    return null;
  }

  private async deleteTabState(tabId: number): Promise<void> {
    try {
      await chrome.storage.session.remove(`tab_${tabId}`);
      console.log(`[HTJ Background] Deleted persisted state for tab ${tabId}`);
    } catch (error) {
      console.error(
        `[HTJ Background] Failed to delete state for tab ${tabId}:`,
        error
      );
    }
  }

  async getTabState(tabId: number): Promise<TabState> {
    if (!this.tabStates.has(tabId)) {
      // Try to load from session storage first
      const savedState = await this.loadTabState(tabId);
      if (savedState) {
        this.tabStates.set(tabId, savedState);
      } else {
        // Create new state
        const newState: TabState = {
          isEnabled: true,
          movieTitle: null,
          jumpscares: [],
        };
        this.tabStates.set(tabId, newState);
      }
    }
    return this.tabStates.get(tabId)!;
  }

  async fetchJumpscares(
    title: string,
    year: string | null
  ): Promise<Jumpscare[]> {
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
          (a: Jumpscare, b: Jumpscare) => a.timeInSeconds - b.timeInSeconds
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
    const state = await this.getTabState(tabId);

    if (state.movieTitle !== title) {
      state.movieTitle = title;
      // Reset jumpscare info for the new movie
      state.jumpscares = [];

      const jumpscares = await this.fetchJumpscares(title, year);
      state.jumpscares = jumpscares.map((j) => ({
        ...j,
        timeInSeconds: j.timestamp_minutes * 60 + j.timestamp_seconds,
      }));
      await this.saveTabState(tabId);

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

  async clearMovieState(tabId: number): Promise<void> {
    this.tabStates.delete(tabId); // Clear in-memory state
    await this.deleteTabState(tabId); // Remove from session storage

    console.log(
      `[HTJ Background] Cleared and deleted movie state for tab ${tabId}`
    );
  }

  async handleToggleState(tabId: number, isEnabled: boolean): Promise<void> {
    const state = await this.getTabState(tabId);
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
