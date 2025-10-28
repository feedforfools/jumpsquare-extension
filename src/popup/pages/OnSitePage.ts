import type { Page } from "../core/Page.ts";
import type { PopupState } from "../../types/index.js";

export class OnSitePage implements Page {
  render(container: HTMLElement, state: PopupState): void {
    container.innerHTML = `
      <div class="text-center space-y-4 flex flex-col items-center">
        <div class="w-16 h-16 bg-blue-500 rounded-base border-2 border-brand-border flex items-center justify-center mx-auto shadow-neo">
          <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
            <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
          </svg>
        </div>
        <div class="neo-card p-4 w-full">
          <h2 class="text-lg font-semibold text-blue-400">Ready to Watch</h2>
          <p class="text-brand-muted mt-2">You're on ${state.currentSite}. Navigate to a movie or show to start.</p>
          <p class="text-sm text-brand-muted mt-4">Status: Waiting for content...</p>
        </div>
      </div>
    `;
  }
}
