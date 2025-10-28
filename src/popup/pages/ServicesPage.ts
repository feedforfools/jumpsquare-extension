import type { Page } from "../core/Page.ts";
import type { PopupState } from "../../types/index.js";
import { ServicesGrid } from "../components/ServicesGrid.js";
import { STREAMING_SERVICES } from "../../shared/utils/constants.ts";

export class ServicesPage implements Page {
  render(container: HTMLElement, _state: PopupState): void {
    const grid = new ServicesGrid(container);
    grid.render(STREAMING_SERVICES);
  }
}
