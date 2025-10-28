import type { Page } from "../core/Page.ts";
import type { PopupState } from "../../types/index.js";

export class SettingsPage implements Page {
  render(container: HTMLElement, _state: PopupState): void {
    container.innerHTML = `
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
}
