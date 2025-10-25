# Jumpsquare - Browser Extension

This repository contains the source code for the official "Here's the Jump!" browser extension. It works in tandem with the main [Jumpsquare](https://github.com/feedforfools/jumpsquare) project, bringing real-time jumpscare alerts directly to your favorite streaming services.

Never be caught off guard by a sudden scare again. The extension automatically detects the movie you're watching, fetches jumpscare data from Jumpsquare database, and displays timely on-screen warnings before each event.

## Core Features

*   **Real-Time Jumpscare Alerts**: Displays on-screen toast notifications a few seconds before a jumpscare occurs.
*   **Automatic Movie Detection**: Intelligently identifies the movie and year you are watching on supported platforms.
*   **Seamless Integration**: Connects to the Heresthejump.com API to retrieve accurate, community-sourced jumpscare timestamps.
*   **Supported Services**: Works on major streaming platforms.
*   **Informative Popup**: The extension popup shows the detected movie, the number of jumpscares, and a link to the full details on the main website.
*   **Efficient & Modern**: Built with TypeScript and Vite, using Manifest V3 for security and performance.

## Supported Services

The extension is designed to be modular, allowing for easy addition of new streaming services.

### Currently Supported:
*   **Netflix**
*   **Amazon Prime Video**

### Planned:
*   Disney+
*   Max (HBO)
*   Hulu

## Tech Stack

*   **Language**: TypeScript
*   **Bundler**: [Vite](https://vitejs.dev/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Extension Framework**: Standard Web Extensions API (Manifest V3)

## Project Structure

The codebase is organized into the main components of a browser extension:

```
/
├── dist/                     # The built, unpacked extension ready for loading
├── public/                   # Static assets like manifest.json and icons
├── src/
│   ├── background/           # Service worker: handles API calls, state management
│   │   ├── modules/          # Logic for API services, state, and message handling
│   │   └── background.ts     # Main entry point for the service worker
│   ├── content/              # Injected into streaming sites: handles DOM interaction
│   │   ├── modules/          # Movie detection, video tracking, notification display
│   │   └── strategies/       # Platform-specific logic for detection and data extraction
│   ├── popup/                # UI code for the extension's popup window
│   │   ├── components/       # Reusable UI components for the popup
│   │   └── index.ts          # Main entry point for the popup
│   ├── shared/               # Code shared across all parts of the extension
│   └── types/                # Global TypeScript types and interfaces
├── vite.config.ts            # Vite build configuration for popup and background
└── vite.content.config.ts    # Vite build configuration for the content script
```

## How It Works

1.  **Service Detection**: The `content` script runs on supported streaming sites. A `ServiceRegistry` uses a strategy pattern (`PrimeVideoStrategy`, `NetflixStrategy`, etc.) to identify the current platform.
2.  **Movie Identification**: When you navigate to a movie page, the `MovieDetector` uses the active strategy to extract the movie's title and year from the DOM or network requests.
3.  **Data Fetching**: The `content` script sends the detected movie info to the `background` service worker. The `MovieHandler` in the background calls the Jumpsquare API via `JumpscareApiService` to fetch the jumpscare data.
4.  **State Management**: The `TabStateManager` in the background script saves the movie and jumpscare data for the specific tab using `chrome.storage.session`. This ensures the state persists during navigation within the tab.
5.  **Alert Scheduling**: The background script sends the jumpscare data back to the `content` script. The `NotificationOrchestrator` receives this data and passes it to the `JumpscareScheduler`.
6.  **Video Tracking**: A `VideoTracker` attaches a listener to the page's `<video>` element. As the video plays, it reports the `currentTime` to the `NotificationOrchestrator`.
7.  **Displaying Alerts**: The `JumpscareScheduler` checks the `currentTime` against its pre-calculated warning windows. When a jumpscare is imminent, it triggers an event. The `NotificationPresenter` then uses a `Toast` module to render a non-intrusive warning on the screen.

## Getting Started (Development)

### Prerequisites

*   [Node.js](https://nodejs.org/) (LTS version recommended)
*   [pnpm](https://pnpm.io/) (or npm/yarn)

### 1. Clone the Repository

```bash
git clone https://github.com/feedforfools/jumpsquare-extension.git
cd jumpsquare-extension
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the Development Build

This command builds the extension in development mode and watches for changes.

```bash
npm run build:dev
```

This will create a `dist` directory in the root of the project.

### 4. Load the Unpacked Extension

**In Google Chrome or other Chromium-based browsers:**

1.  Navigate to `chrome://extensions`.
2.  Enable **"Developer mode"** using the toggle in the top-right corner.
3.  Click on the **"Load unpacked"** button.
4.  Select the `dist` folder from this project.

The extension is now installed and will automatically reload when you make changes to the source code (as long as the `npm run build:dev` command is running).