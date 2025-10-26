import type { PopupState } from "../../types/index.js";
import { TabService } from "../../shared/services/tabService.js";

export class Footer {
  private container: HTMLElement;
  private readonly baseUrl = "https://www.heresthejump.com";

  constructor(container: HTMLElement) {
    this.container = container;
  }

  render(state: PopupState): void {
    let url = this.baseUrl;
    let text = "Visit Here's The Jump!";

    if (
      state.currentPage === "movie-detected" &&
      state.movie?.isInDb &&
      state.movie.id
    ) {
      url = `${this.baseUrl}/movie/${state.movie.id}`;
      text = "View Full Details on HTJ.com";
    }

    this.container.innerHTML = `
      <a 
        href="${url}" 
        target="_blank" 
        class="text-xs text-brand-muted hover:text-accent transition-colors"
      >
        ${text}
      </a>
    `;

    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    const link = this.container.querySelector("a");
    link?.addEventListener("click", async (e) => {
      e.preventDefault();
      const url = link.getAttribute("href");
      if (url) {
        await TabService.openUrl(url);
        window.close();
      }
    });
  }
}
