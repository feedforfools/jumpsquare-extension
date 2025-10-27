export interface User {
  id?: string;
  name?: string;
  email?: string;
  isPremium?: boolean;
}

export interface StreamingService {
  id: string;
  name: string;
  url: string;
  logoUrl: string;
  isSupported: boolean;
  isPremium?: boolean;
}

export interface Movie {
  id?: string;
  title: string;
  year: string;
  jumpscareCount: number;
  jumpscares: Jumpscare[];
  isInDb: boolean;
  runtime?: string;
  rating?: string;
  genres?: string[];
  directors?: string[];
}

export interface StrategyMovieInfo {
  title: string | null;
  year: string | null;
  runtime: string | null;
  rating: string | null;
  genres: string[] | null;
  directors?: string[] | null;
}

export interface PopupState {
  currentPage:
    | "services"
    | "on-site"
    | "movie-detected"
    | "active"
    | "settings";
  user: User | null;
  isOnSupportedSite: boolean;
  currentSite?: string;
  movie?: Movie;
  movieIsLoading: boolean;
}

export interface Jumpscare {
  id: string;
  category: string;
  timestamp_minutes: number;
  timestamp_seconds: number;
  timeInSeconds: number;
  description?: string;
}

export interface TabState {
  isEnabled: boolean;
  movie: Movie | null;
}
