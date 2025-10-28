import type { PopupState } from "../../types/index.js";

export interface Page {
  render(container: HTMLElement, state: PopupState): void;
  destroy?(): void;
}
