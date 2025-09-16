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

export interface MovieInfo {
  title: string;
  year?: string;
  jumpscareCount?: number;
  hasJumpscares?: boolean;
  isLoading?: boolean;
}

export interface AppState {
  currentPage:
    | "services"
    | "on-site"
    | "movie-detected"
    | "active"
    | "settings";
  user: User | null;
  isOnSupportedSite: boolean;
  currentSite?: string;
  movieInfo?: MovieInfo;
}

export interface Jumpscare {
  id: string;
  category: string;
  timestamp_minutes: number;
  timestamp_seconds: number;
  description?: string;
}
