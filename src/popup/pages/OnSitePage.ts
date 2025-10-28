import type { Page } from "../core/Page.ts";
import type { PopupState } from "../../types/index.js";
import { STREAMING_SERVICES } from "../../shared/utils/constants.ts";

export class OnSitePage implements Page {
  render(container: HTMLElement, state: PopupState): void {
    const service =
      STREAMING_SERVICES.find((s) => s.name === state.currentSite) || null;

    const logoHtml = service
      ? `<img src="${service.logoUrl}" alt="${service.name}" class="service-logo h-14" onerror="this.style.display='none'">`
      : `<span class="neo-badge bg-dark-bg text-xs">${
          state.currentSite ?? "This site"
        }</span>`;

    container.innerHTML = `
      <div class="space-y-3 text-center flex flex-col items-center">
        <p class="text-sm text-brand-muted">You're on</p>
        <div class="neo-card p-6 flex items-center justify-center">
          ${logoHtml}
        </div>
        <p class="text-sm text-brand-muted">Navigate to a movie or show to start.</p>
      </div>
    `;
  }
}
