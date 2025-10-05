import type { TabState } from "../../types/index.js";

export class TabStateManager {
  private tabStates = new Map<number, TabState>();

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
          movie: null,
        };
        this.tabStates.set(tabId, newState);
      }
    }
    return this.tabStates.get(tabId)!;
  }

  async saveTabState(tabId: number): Promise<void> {
    const state = await this.getTabState(tabId);
    await chrome.storage.session.set({
      [`tab_${tabId}`]: state,
    });
    console.log(
      `[HTJ Background] Saved state for tab ${tabId} to session storage`
    );
  }

  async clearTabState(tabId: number): Promise<void> {
    this.tabStates.delete(tabId); // Clear in-memory state
    await this.deleteTabState(tabId); // Remove from session storage

    console.log(
      `[HTJ Background] Cleared and deleted movie state for tab ${tabId}`
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
          movie:
            typeof savedState.movie === "object" && savedState.movie !== null
              ? {
                  id:
                    typeof savedState.movie.id === "string"
                      ? savedState.movie.id
                      : undefined,
                  title:
                    typeof savedState.movie.title === "string"
                      ? savedState.movie.title
                      : null,
                  year:
                    typeof savedState.movie.year === "string"
                      ? savedState.movie.year
                      : null,
                  jumpscareCount:
                    typeof savedState.movie.jumpscareCount === "number"
                      ? savedState.movie.jumpscareCount
                      : 0,
                  jumpscares: Array.isArray(savedState.movie.jumpscares)
                    ? savedState.movie.jumpscares
                    : [],
                  isInDb:
                    typeof savedState.movie.isInDb === "boolean"
                      ? savedState.movie.isInDb
                      : false,
                }
              : null,
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
}
