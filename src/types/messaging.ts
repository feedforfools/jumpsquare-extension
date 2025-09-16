import type { Jumpscare } from "./index.js";

// Content Script -> Background Script
export interface MovieDetectedMessage {
  type: "MOVIE_DETECTED";
  payload: {
    title: string;
    year: string | null;
  };
}

// Background Script -> Content Script
export interface JumpscareDataMessage {
  type: "JUMPSCARE_DATA";
  payload: {
    jumpscares: Jumpscare[];
    movieTitle: string;
  };
}

// Popup -> Background Script
export interface GetTabStateMessage {
  type: "GET_TAB_STATE";
}

export interface ToggleStateMessage {
  type: "TOGGLE_STATE";
  payload: {
    isEnabled: boolean;
  };
}
