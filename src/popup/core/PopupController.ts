import type { PopupState } from "../../types/index.js";
import { Header } from "../components/Header.ts";
import { Footer } from "../components/Footer.ts";
import type { Page } from "./Page.ts";
import { ServicesPage } from "../pages/ServicesPage.ts";
import { OnSitePage } from "../pages/OnSitePage.ts";
import { MovieDetectedPage } from "../pages/MovieDetectedPage.ts";
import { ActivePage } from "../pages/ActivePage.ts";
import { SettingsPage } from "../pages/SettingsPage.ts";
import { TabService } from "../../shared/services/tabService.js";
import type { GetTabStateMessage } from "../../types/messaging.js";
import { popupLogger } from "../../shared/utils/logger.js";

export class PopupController {
  private state: PopupState = {
    currentPage: "services",
    user: null,
    isOnSupportedSite: false,
    movie: undefined,
    movieIsLoading: false,
  };

  private readonly header: Header;
  private readonly footer: Footer;
  private readonly mainEl: HTMLElement;

  private readonly pages: Record<PopupState["currentPage"], Page>;

  constructor() {
    const headerEl = document.getElementById("header")!;
    const mainEl = document.getElementById("main-content")!;
    const footerEl = document.getElementById("footer")!;

    this.header = new Header(headerEl);
    this.footer = new Footer(footerEl);
    this.mainEl = mainEl;

    this.pages = {
      services: new ServicesPage(),
      "on-site": new OnSitePage(),
      "movie-detected": new MovieDetectedPage(),
      active: new ActivePage(),
      settings: new SettingsPage(),
    };
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
          rating: bgState.movie.rating,
          runtime: bgState.movie.runtime,
          genres: bgState.movie.genres,
          directors: bgState.movie.directors,
        };
      } else {
        this.state.currentPage = "on-site";
      }
    } catch (error) {
      popupLogger.error("Could not get state from background script:", error);
      this.state.currentPage = "on-site";
      this.mainEl.innerHTML = `<p class="text-red-400 text-center">Error: Could not connect to extension background. Try reloading the page.</p>`;
    }
  }

  private render(): void {
    this.header.render(this.state.user);
    this.footer.render(this.state);

    const page = this.pages[this.state.currentPage];
    page.render(this.mainEl, this.state);
  }
}
