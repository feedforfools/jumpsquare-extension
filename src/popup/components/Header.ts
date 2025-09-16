import type { User } from "../../types/index.js";

export class Header {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  render(user: User | null): void {
    this.container.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
            <span class="text-sm font-bold">🎬</span>
          </div>
          <div>
            <h1 class="text-lg font-bold">Here's the Jump!</h1>
          </div>
        </div>
        <div class="flex items-center space-x-2">
          ${user ? this.renderUserInfo(user) : this.renderLoginButton()}
          <button id="settings-btn" class="p-2 hover:bg-gray-700 rounded">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"></path>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  private renderUserInfo(user: User): string {
    return `
      <div class="flex items-center space-x-2">
        <div class="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
          <span class="text-xs font-bold">${user.name?.charAt(0) || "U"}</span>
        </div>
        ${
          user.isPremium
            ? '<span class="text-xs bg-accent px-2 py-1 rounded">Premium</span>'
            : ""
        }
      </div>
    `;
  }

  private renderLoginButton(): string {
    return `
      <button id="login-btn" class="text-sm bg-accent px-3 py-1 rounded hover:bg-orange-600 transition-colors">
        Login
      </button>
    `;
  }
}
