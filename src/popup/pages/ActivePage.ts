import type { Page } from "../core/Page.ts";
import type { PopupState } from "../../types/index.js";

export class ActivePage implements Page {
  render(container: HTMLElement, state: PopupState): void {
    container.innerHTML = `
      <div class="text-center space-y-4 flex flex-col items-center">
        <div class="w-16 h-16 bg-green-500 rounded-base border-2 border-brand-border flex items-center justify-center mx-auto shadow-neo">
          <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
          </svg>
        </div>
        <div class="neo-card p-4 w-full">
          <h2 class="text-lg font-semibold text-green-400">Extension Active</h2>
          <p class="text-brand-muted mt-2">Monitoring jumpscares on ${
            state.currentSite
          }</p>
          ${
            state.movie
              ? `<p class="text-brand-foreground mt-1">${state.movie.title}</p>`
              : ""
          }
          <div class="mt-4 pt-4 border-t-2 border-brand-border">
            ${
              state.movie && state.movie.jumpscareCount > 0
                ? `<p class="text-sm text-orange-400 mt-1">${state.movie.jumpscareCount} jumpscares detected</p>`
                : `<p class="text-sm text-green-400 mt-1">No jumpscares in this content</p>`
            }
          </div>
        </div>
      </div>
    `;
  }
}
