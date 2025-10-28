import type { Page } from "../core/Page.ts";
import type { PopupState } from "../../types/index.js";

export class MovieDetectedPage implements Page {
  render(container: HTMLElement, state: PopupState): void {
    const movie = state.movie;

    if (!movie || state.movieIsLoading) {
      container.innerHTML = `
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

    const hasJumpscares = movie.jumpscareCount > 0;
    const jumpscareText =
      movie.jumpscareCount === 1 ? "jumpscare" : "jumpscares";
    const genresText =
      movie.genres && movie.genres.length > 0 ? movie.genres[0] : "Unknown";
    const directorsText =
      movie.directors && movie.directors.length > 0
        ? movie.directors.slice(0, 2).join(", ")
        : "Unknown";

    let badgeContent = "";
    let badgeClass = "";
    let bottomText = "";
    let jumpscareInfo = "";

    if (movie.isInDb) {
      if (hasJumpscares) {
        badgeContent = "Alerts Ready";
        badgeClass = "bg-accent text-white";
        bottomText =
          "When the movie starts playing, you'll receive on-screen warnings before each jumpscare.";
        jumpscareInfo = `
          <div class="flex items-center space-x-1.5">
            <svg class="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M12 2L3 13h9l-1 8 9-11h-9z"></path></svg>
            <span class="text-sm font-medium">${movie.jumpscareCount} ${jumpscareText}</span>
          </div>
        `;
      } else {
        badgeContent = "No Scares";
        badgeClass = "bg-green-500 text-white";
        bottomText =
          "This movie has been verified to have no jumpscares. Enjoy watching!";
        jumpscareInfo = `
          <div class="flex items-center space-x-1.5">
            <svg class="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M12 2L3 13h9l-1 8 9-11h-9z"></path></svg>
            <span class="text-sm font-medium">0 jumpscares</span>
          </div>
        `;
      }
    } else {
      badgeContent = "No Alerts";
      badgeClass = "bg-gray-500 text-white";
      bottomText =
        "We don't have jumpscare data for this movie yet. Consider contributing by visiting the website!";
      jumpscareInfo = `
        <div class="flex items-center space-x-1.5">
          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M12 2L3 13h9l-1 8 9-11h-9z"></path></svg>
          <span class="text-sm font-medium text-gray-400">No data in DB</span>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="space-y-3">
        <p class="text-sm text-center text-brand-muted">You're watching</p>
        <div class="neo-card p-0 w-full">
          <div class="p-4">
            <div class="flex items-start justify-between">
              <div class="min-w-0 flex-1 pr-2">
                <h2 class="block truncate text-lg leading-tight font-semibold text-brand-foreground" title="${
                  movie.title
                }">
                  ${movie.title}
                </h2>
              </div>
              <div class="neo-badge text-xs flex-shrink-0 bg-dark-bg">
                ${movie.rating || "N/A"}
              </div>
            </div>
            <div class="flex items-center flex-wrap gap-2 text-sm text-brand-muted mt-1">
              <span>${movie.year}</span>
              <span>•</span>
              <span>${genresText}</span>
              ${
                movie.runtime
                  ? `
              <span>•</span>
              <div class="flex items-center space-x-1">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span>${movie.runtime}m</span>
              </div>`
                  : ""
              }
            </div>
            ${
              movie.directors && movie.directors.length > 0
                ? `
              <div class="flex items-center space-x-1 text-sm text-brand-muted mt-1">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                <span>${directorsText}</span>
              </div>`
                : ""
            }
          </div>

          <div class="p-4 pt-0">
            <div class="flex items-center justify-between">
              ${jumpscareInfo}
              <div class="neo-badge text-xs ${badgeClass}">
                ${badgeContent}
              </div>
            </div>
          </div>
        </div>
        <p class="text-xs text-center text-brand-muted px-4">
          ${bottomText}
        </p>
      </div>
    `;
  }
}
