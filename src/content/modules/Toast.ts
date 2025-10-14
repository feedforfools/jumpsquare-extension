export interface ToastConfig {
  id: string;
  message: string;
  icon: string;
  displayDuration: number;
  class: "minor" | "major" | "info"; // TODO: add "info" style
}

const commonTextContext = `
      .htj-toast {
        position: absolute !important;
        top: 15vh !important;
        right: 20px !important;
        background: rgba(0, 0, 0, 0.95) !important;
        color: white !important;
        padding: 20px 24px !important;
        border-radius: 12px !important;
        border-left: 6px solid #ff6b35 !important;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5) !important;
        z-index: 999999 !important;
        max-width: 350px !important;
        transform: translateX(120%) !important;
        transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        backdrop-filter: blur(10px) !important;
        -webkit-backdrop-filter: blur(10px) !important;
      }
      
      .htj-toast.show {
        transform: translateX(0) !important;
      }
      
      .htj-toast-content {
        display: flex !important;
        align-items: center !important;
        gap: 16px !important;
      }
      
      .htj-toast-icon {
        font-size: 32px !important;
        flex-shrink: 0 !important;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3)) !important;
      }
      
      .htj-toast-text {
        font-size: 16px !important;
        font-weight: 600 !important;
        line-height: 1.3 !important;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5) !important;
        white-space: pre-line !important;
      }
      
      .htj-toast.minor {
        border-left-color: #ffa500 !important;
      }
      
      .htj-toast.major {
        border-left-color: #ff3333 !important;
        animation: htj-pulse 1.5s infinite !important;
      }
      
      .htj-toast.info {
        border-left-color: #4a9eff !important;
        background: rgba(0, 0, 0, 0.92) !important;
      }
      
      .htj-toast.info .htj-toast-text {
        font-size: 14px !important;
        font-weight: 500 !important;
      }
      
      @keyframes htj-pulse {
        0%, 100% { 
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 0 rgba(255, 51, 51, 0.4) !important;
        }
        50% { 
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 8px rgba(255, 51, 51, 0) !important;
        }
      }
    `;

export class Toast {
  private config: ToastConfig | null = null;

  constructor() {
    this.injectStyles();
    this.setupFullscreenListeners();
  }

  private injectStyles(): void {
    if (document.getElementById("htj-styles")) return;

    const styles = document.createElement("style");
    styles.id = "htj-styles";
    styles.textContent = commonTextContext;
    document.head.appendChild(styles);
  }

  private injectFullscreenStyles(container: HTMLElement): void {
    if (container.querySelector("#htj-fullscreen-styles")) return;

    const styles = document.createElement("style");
    styles.id = "htj-fullscreen-styles";
    styles.textContent = commonTextContext;
    container.appendChild(styles);
  }

  private setupFullscreenListeners(): void {
    const fullscreenEvents = [
      "fullscreenchange",
      "webkitfullscreenchange",
      "mozfullscreenchange",
      "MSFullscreenChange",
    ];

    fullscreenEvents.forEach((event) => {
      document.addEventListener(event, () => {
        console.log("[HTJ Display] Fullscreen state changed");
        this.handleFullscreenChange();
      });
    });
  }

  private handleFullscreenChange(): void {
    // Re-inject styles into fullscreen element if needed
    const fullscreenElement = this.getFullscreenElement();
    if (fullscreenElement) {
      this.injectFullscreenStyles(fullscreenElement);
    }
    this.moveActiveToastsToCorrectContainer();
  }

  private moveActiveToastsToCorrectContainer(): void {
    const correctContainer = this.getToastContainer();

    if (this.config !== null) {
      const toastElement = document.getElementById(this.config.id);
      if (toastElement && !correctContainer.contains(toastElement)) {
        console.log(
          `[HTJ Display] Moving toast ${this.config.id} to correct container`
        );
        correctContainer.appendChild(toastElement);
      }
    }
  }

  private getFullscreenElement(): HTMLElement | null {
    return (document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement) as HTMLElement | null;
  }

  showToast(config: ToastConfig): void {
    this.config = config;

    const toastDiv = document.createElement("div");
    toastDiv.id = config.id;
    toastDiv.className = `htj-toast ${config.class}`;
    toastDiv.innerHTML = `
      <div class="htj-toast-content">
        <div class="htj-toast-icon">${config.icon}</div>
        <div class="htj-toast-text">${config.message}</div>
      </div>
    `;

    const container = this.getToastContainer();
    container.appendChild(toastDiv);
    // Trigger slide-in animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toastDiv.classList.add("show");
      });
    });

    // Auto-remove after warning window duration
    setTimeout(() => {
      toastDiv.classList.remove("show"); // Trigger slide-out animation before removal
      setTimeout(() => {
        if (container.contains(toastDiv)) {
          toastDiv.remove();
        }
        this.config = null;
      }, 400);
    }, config.displayDuration);
  }

  private getToastContainer(): HTMLElement {
    const fullscreenElement = this.getFullscreenElement();
    if (fullscreenElement) {
      return fullscreenElement as HTMLElement;
    }
    return document.body;
  }

  clearToast(): void {
    if (this.config === null) return;

    const toastDiv = document.getElementById(this.config.id);
    if (toastDiv) {
      toastDiv.remove();
    }
    this.config = null;
  }
}
