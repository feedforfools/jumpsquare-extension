export interface MovieInfo {
  title: string | null;
  year: string | null;
}

export interface StreamingServiceStrategy {
  /**
   * Identifies the streaming service from a URL
   */
  matches(url: string): boolean;

  /**
   * Checks if the current page is a movie/show detail page
   */
  isOnMoviePage(url: string): boolean;

  /**
   * Checks if the current page is in the video player
   */
  isInVideoPlayer(url: string): boolean;

  /**
   * Extracts movie information from the DOM
   */
  extractMovieInfo(): MovieInfo;

  /**
   * Finds and returns the video element
   */
  findVideoElement(): HTMLVideoElement | null;

  /**
   * Gets the service name
   */
  getServiceName(): string;
}
