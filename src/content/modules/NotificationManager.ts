import type { Jumpscare } from "../../types/index.js";

const TOAST_DURATION_S = 8;

export class NotificationManager {
  displayJumpscareNotification(jumpscare: Jumpscare): void {
    const existingNotification = document.getElementById(
      `htj-notif-${jumpscare.id}`
    );
    if (existingNotification) return;

    const notification = document.createElement("div");
    notification.id = `htj-notif-${jumpscare.id}`;
    notification.style.position = "fixed";
    notification.style.bottom = "20px";
    notification.style.right = "20px";
    notification.style.padding = "1rem";
    notification.style.backgroundColor = "white";
    notification.style.border = "2px solid black";
    notification.style.boxShadow = "4px 4px 0px black";
    notification.style.zIndex = "99999";
    notification.textContent = `${jumpscare.category.toUpperCase()} JUMPSCARE INCOMING!`;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, TOAST_DURATION_S * 1000);
  }
}
