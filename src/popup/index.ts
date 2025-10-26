import type { PopupState } from "../types/index.js";
import { STREAMING_SERVICES } from "../shared/utils/constants.ts";
import { TabService } from "../shared/services/tabService.js";
import { Header } from "./components/Header.ts";
import { ServicesGrid } from "./components/ServicesGrid.js";
import { Footer } from "./components/Footer.ts";
import type { GetTabStateMessage } from "../types/messaging.js";
import { popupLogger } from "../shared/utils/logger.js";

class PopupApp {
  private state: PopupState;
  private header: Header;
  private servicesGrid: ServicesGrid;
  private footer: Footer;

  constructor() {
    this.state = {
      currentPage: "services",
      user: null,
      isOnSupportedSite: false,
      movie: undefined,
      movieIsLoading: false,
    };

    const headerElement = document.getElementById("header")!;
    const mainElement = document.getElementById("main-content")!;
    const footerElement = document.getElementById("footer")!;
    this.header = new Header(headerElement);
    this.servicesGrid = new ServicesGrid(mainElement);
    this.footer = new Footer(footerElement);
  }

  async init(): Promise<void> {
    await this.determineCurrentState();
    this.render();
  }

  private async determineCurrentState(): Promise<void> {
    const currentTab = await TabService.getCurrentTab();
    if (!currentTab?.id || !currentTab.url) {
      this.state.currentPage = "services";
      return;
    }

    this.state.isOnSupportedSite = TabService.isOnSupportedSite(currentTab.url);
    this.state.currentSite =
      TabService.getSupportedSiteName(currentTab.url) || undefined;

    if (!this.state.isOnSupportedSite) {
      this.state.currentPage = "services";
      return;
    }

    try {
      const message: GetTabStateMessage = {
        type: "GET_TAB_STATE",
        tabId: currentTab.id,
      };

      const bgState = await chrome.runtime.sendMessage(message);
      if (bgState && bgState.movie) {
        this.state.currentPage = "movie-detected";
        this.state.movie = {
          id: bgState.movie.id,
          title: bgState.movie.title,
          year: bgState.movie.year || undefined,
          jumpscareCount: bgState.movie.jumpscares.length,
          jumpscares: bgState.movie.jumpscares,
          isInDb: bgState.movie.isInDb,
        };
      } else {
        this.state.currentPage = "on-site";
      }
    } catch (error) {
      popupLogger.error("Could not get state from background script:", error);
      this.state.currentPage = "on-site";
      const mainElement = document.getElementById("main-content")!;
      mainElement.innerHTML = `<p class="text-red-400 text-center">Error: Could not connect to extension background. Try reloading the page.</p>`;
    }

    // TODO: Check for user authentication status
    // this.state.user = await this.getUserFromStorage();
  }

  private render(): void {
    this.header.render(this.state.user);
    this.footer.render(this.state);

    switch (this.state.currentPage) {
      case "services":
        this.renderServicesPage();
        break;
      case "on-site":
        this.renderOnSitePage();
        break;
      case "movie-detected":
        this.renderMovieDetectedPage();
        break;
      case "active":
        this.renderActivePage();
        break;
      case "settings":
        this.renderSettingsPage();
        break;
    }
  }

  private renderServicesPage(): void {
    this.servicesGrid.render(STREAMING_SERVICES);
  }

  private renderOnSitePage(): void {
    const mainElement = document.getElementById("main-content")!;
    mainElement.innerHTML = `
      <div class="text-center space-y-4 flex flex-col items-center">
        <div class="w-16 h-16 bg-blue-500 rounded-base border-2 border-brand-border flex items-center justify-center mx-auto shadow-neo">
          <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
            <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
          </svg>
        </div>
        <div class="neo-card p-4 w-full">
          <h2 class="text-lg font-semibold text-blue-400">Ready to Watch</h2>
          <p class="text-brand-muted mt-2">You're on ${this.state.currentSite}. Navigate to a movie or show to start.</p>
          <p class="text-sm text-brand-muted mt-4">Status: Waiting for content...</p>
        </div>
      </div>
    `;
  }

  private renderMovieDetectedPage(): void {
    const mainElement = document.getElementById("main-content")!;
    const movie = this.state.movie;

    if (!movie || this.state.movieIsLoading) {
      mainElement.innerHTML = `
        <div class="text-center space-y-4">
          <div class="w-16 h-16 bg-yellow-500 rounded-base flex items-center justify-center mx-auto animate-spin">
            <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div>
            <h2 class="text-lg font-semibold text-yellow-400">Analyzing Content</h2>
            <p class="text-brand-muted mt-2">Detecting movie information...</p>
          </div>
        </div>
      `;
      return;
    }

    const statusText = movie.isInDb
      ? movie.jumpscareCount > 0
        ? `${movie.jumpscareCount} jumpscares found.`
        : "No jumpscares detected."
      : "Not in our database yet.";

    const statusColor = movie.isInDb
      ? movie.jumpscareCount > 0
        ? "text-orange-400"
        : "text-green-400"
      : "text-yellow-400";
    const iconColor = movie.isInDb
      ? movie.jumpscareCount > 0
        ? "bg-orange-500"
        : "bg-green-500"
      : "bg-yellow-500";

    mainElement.innerHTML = `
      <div class="text-center space-y-4 flex flex-col items-center">
        <div class="w-16 h-16 ${iconColor} rounded-base border-2 border-brand-border flex items-center justify-center mx-auto shadow-neo">
          ${
            movie.isInDb
              ? movie.jumpscareCount > 0
                ? `<svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>`
                : `<svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>`
              : `<svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`
          }
        </div>
        <div class="neo-card p-4 w-full">
          <h2 class="text-lg font-semibold ${statusColor}">Movie Detected</h2>
          <p class="text-brand-foreground mt-1 font-medium">${movie.title}</p>
          ${
            movie.year
              ? `<p class="text-brand-muted text-sm">${movie.year}</p>`
              : ""
          }
          <div class="mt-4 pt-4 border-t-2 border-brand-border space-y-2">
            <p class="text-sm ${statusColor}">${statusText}</p>
            <p class="text-xs text-brand-muted">Start playing to begin monitoring</p>
          </div>
        </div>
      </div>
    `;
  }

  private renderActivePage(): void {
    const mainElement = document.getElementById("main-content")!;
    mainElement.innerHTML = `
      <div class="text-center space-y-4 flex flex-col items-center">
        <div class="w-16 h-16 bg-green-500 rounded-base border-2 border-brand-border flex items-center justify-center mx-auto shadow-neo">
          <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
          </svg>
        </div>
        <div class="neo-card p-4 w-full">
          <h2 class="text-lg font-semibold text-green-400">Extension Active</h2>
          <p class="text-brand-muted mt-2">Monitoring jumpscares on ${
            this.state.currentSite
          }</p>
          ${
            this.state.movie
              ? `<p class="text-brand-foreground mt-1">${this.state.movie.title}</p>`
              : ""
          }
          <div class="mt-4 pt-4 border-t-2 border-brand-border">
            ${
              this.state.movie && this.state.movie.jumpscareCount > 0
                ? `<p class="text-sm text-orange-400 mt-1">${this.state.movie.jumpscareCount} jumpscares detected</p>`
                : `<p class="text-sm text-green-400 mt-1">No jumpscares in this content</p>`
            }
          </div>
        </div>
      </div>
    `;
  }

  private renderSettingsPage(): void {
    const mainElement = document.getElementById("main-content")!;
    mainElement.innerHTML = `
      <div class="space-y-4">
        <h2 class="text-lg font-semibold">Settings</h2>
        <div class="neo-card p-4 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-sm">Warning window</span>
            <select class="bg-card-bg border-2 border-brand-border rounded-base px-2 py-1 text-sm shadow-neo">
              <option value="5">5 seconds</option>
              <option value="8" selected>8 seconds</option>
              <option value="10">10 seconds</option>
            </select>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm">Sound alerts</span>
            <input type="checkbox" class="rounded">
          </div>
          <button class="neo-button w-full mt-2">
            Save Settings
          </button>
        </div>
      </div>
    `;
  }

  // private attachGlobalEventListeners(): void {
  //   document.addEventListener("click", (e) => {
  //     const target = e.target as HTMLElement;

  //     if (target.id === "settings-btn") {
  //       this.state.currentPage = "settings";
  //       this.render();
  //     }

  //     if (target.id === "login-btn") {
  //       // TODO: Implement login flow
  //       popupLogger.log("Login clicked");
  //     }
  //   });
  // }
}

// Initialize the app
document.addEventListener("DOMContentLoaded", () => {
  const app = new PopupApp();
  app.init();
});
