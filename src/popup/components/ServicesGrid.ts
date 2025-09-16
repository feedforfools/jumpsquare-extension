import type { StreamingService } from "../../types/index.js";
import { TabService } from "../../shared/services/tabService.js";

export class ServicesGrid {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  render(services: StreamingService[]): void {
    const freeServices = services.filter((s) => !s.isPremium);
    const premiumServices = services.filter((s) => s.isPremium);

    this.container.innerHTML = `
      <div class="space-y-6">
        <div class="text-center">
          <p class="text-gray-300 mb-6">To use the extension, please select one of the following services below.</p>
        </div>
        
        <div>
          <h3 class="text-sm font-semibold text-gray-400 mb-3">Free services</h3>
          <div class="grid grid-cols-3 gap-3">
            ${freeServices
              .map((service) => this.renderServiceCard(service))
              .join("")}
          </div>
        </div>
        
        ${
          premiumServices.length > 0
            ? `
          <div>
            <div class="flex items-center space-x-2 mb-3">
              <span class="text-sm font-semibold text-accent">⭐</span>
              <h3 class="text-sm font-semibold text-accent">Premium Services</h3>
            </div>
            <div class="grid grid-cols-3 gap-3">
              ${premiumServices
                .map((service) => this.renderServiceCard(service))
                .join("")}
            </div>
          </div>
        `
            : ""
        }
      </div>
    `;

    this.attachEventListeners();
  }

  private renderServiceCard(service: StreamingService): string {
    const isActive = service.isSupported;
    const cardClasses = isActive
      ? "service-card relative cursor-pointer"
      : "service-card relative cursor-not-allowed opacity-50 grayscale";

    const imageClasses = isActive ? "service-logo" : "service-logo grayscale";

    return `
      <div class="${cardClasses}" data-service-id="${service.id}" data-url="${service.url}" data-supported="${isActive}">
        <img src="${service.logoUrl}" alt="${service.name}" class="${imageClasses}" onerror="this.style.display='none'">
      </div>
    `;
  }

  private attachEventListeners(): void {
    const serviceCards = this.container.querySelectorAll(".service-card");
    serviceCards.forEach((card) => {
      card.addEventListener("click", async () => {
        const isSupported = card.getAttribute("data-supported") === "true";
        if (!isSupported) {
          return; // Don't do anything for inactive services
        }

        const url = card.getAttribute("data-url");
        if (url) {
          await TabService.openUrl(url);
          window.close();
        }
      });
    });
  }
}
